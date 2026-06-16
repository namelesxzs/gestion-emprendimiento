import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

st.set_page_config(page_title="Dashboard Hosti 🍬", layout="wide", page_icon="🍬")

# ─── TABLAS DE PRECIOS ────────────────────────────────────────────────────────
PRECIO_INICIAL   = {60: 42500, 30: 38600, 10: 27800, 5: 18000}
PRECIO_DESCUENTO = {60: 32000, 30: 28600, 10: 22000, 5: 14000}
PRECIO_DIST      = 12000       # distribuidor paga por paquete (60 mg)
COSTO_PROD       = {60: 9240, 30: 8265, 10: 6535, 5: 5665}
COSTO_DIST       = 5302        # costo producción cuando es pedido de distribuidor

ORDEN_MESES = ["enero","febrero","marzo","abril","mayo","junio",
               "julio","agosto","septiembre","octubre","noviembre","diciembre"]

# ─── CARGA ────────────────────────────────────────────────────────────────────
@st.cache_data
def cargar(source):
    raw = pd.read_excel(source, sheet_name=0, header=0, usecols="A:L")
    raw.columns = [c.strip() for c in raw.columns]

    raw["mes"]          = raw["mes"].astype(str).str.strip().str.lower()
    raw["clientes"]     = raw["clientes"].astype(str).str.strip().str.lower()
    raw["numero-id"]    = raw["numero-id"].astype(str).str.strip()
    raw["categoria_mg"] = pd.to_numeric(raw["categoria_mg"], errors="coerce")

    for col in ["total_pagado-cliente","producto_precio","envio",
                "ganancia","paquetes","precio+envio","propina","dia"]:
        raw[col] = pd.to_numeric(raw[col], errors="coerce").fillna(0)

    # Identificar distribuidor: camila con id 3207878778
    raw["tipo"] = raw.apply(
        lambda r: "Distribuidor"
        if (r["clientes"] == "camila" and r["numero-id"] == "3207878778")
        else "Cliente", axis=1
    )

    raw["mes_orden"] = raw["mes"].apply(
        lambda m: ORDEN_MESES.index(m) if m in ORDEN_MESES else 99
    )
    raw = raw.sort_values(["mes_orden","dia"]).reset_index(drop=True)

    # ── CONTEO UNO A UNO: cuántas veces aparece cada numero-id ──────────────
    conteo_id = {}
    for _, row in raw.iterrows():          # ← iteramos FILA A FILA
        uid = row["numero-id"]
        conteo_id[uid] = conteo_id.get(uid, 0) + 1

    raw["veces_compra"] = raw["numero-id"].map(conteo_id)
    raw["recurrencia"]  = raw["veces_compra"].apply(
        lambda v: "Recurrente" if v > 1 else "Nuevo"
    )

    # ── Precio esperado por unidad según tipo ────────────────────────────────
    def precio_unitario_inicial(row):
        if row["tipo"] == "Distribuidor":
            return PRECIO_DIST
        return PRECIO_INICIAL.get(int(row["categoria_mg"]), 0)

    def precio_unitario_descuento(row):
        if row["tipo"] == "Distribuidor":
            return PRECIO_DIST
        return PRECIO_DESCUENTO.get(int(row["categoria_mg"]), 0)

    raw["precio_unitario_ini"] = raw.apply(precio_unitario_inicial, axis=1)
    raw["precio_unitario_des"] = raw.apply(precio_unitario_descuento, axis=1)
    raw["ingreso_esperado_ini"] = raw["precio_unitario_ini"] * raw["paquetes"]
    raw["ingreso_esperado_des"] = raw["precio_unitario_des"] * raw["paquetes"]

    return raw, conteo_id

# ─── SIDEBAR ─────────────────────────────────────────────────────────────────
st.sidebar.markdown("## 🍬 Hosti Dashboard")
uploaded = st.sidebar.file_uploader("📂 Cargar hosti.xlsx", type=["xlsx"])

RUTA_DEFAULT = "hosti.xlsx"

if uploaded:
    df, conteo_id = cargar(uploaded)
else:
    try:
        df, conteo_id = cargar(RUTA_DEFAULT)
    except Exception:
        try:
            df, conteo_id = cargar("hosti.xlsx")
        except Exception:
            st.warning("⬅️ Carga tu archivo **hosti.xlsx** desde la barra lateral.")
            st.stop()

meses_doc = [m for m in ORDEN_MESES if m in df["mes"].values]
n_meses   = len(meses_doc)

st.sidebar.markdown("---")
st.sidebar.markdown("### 🔍 Filtros")
mes_sel  = st.sidebar.multiselect("Mes", meses_doc, default=meses_doc)
tipo_sel = st.sidebar.multiselect("Tipo", ["Cliente","Distribuidor"], default=["Cliente","Distribuidor"])

dff = df[df["mes"].isin(mes_sel) & df["tipo"].isin(tipo_sel)].copy()

dff_cli = dff[dff["tipo"] == "Cliente"]
dff_dis = dff[dff["tipo"] == "Distribuidor"]
dff_rec = dff[dff["recurrencia"] == "Recurrente"]
dff_new = dff[dff["recurrencia"] == "Nuevo"]

# ════════════════════════════════════════════════════════════════════════════
# CONTEOS EXACTOS UNO A UNO (fila a fila, sin .count() ni len())
# ════════════════════════════════════════════════════════════════════════════

# Total facturas: sumamos 1 por cada fila
total_facturas = 0
ids_vistos = []
for _, row in dff.iterrows():
    total_facturas += 1
    ids_vistos.append(row["numero-id"])

# Clientes únicos: recorremos la lista uno a uno
ids_unicos_set = set()
ids_unicos_lista = []
for uid in ids_vistos:
    if uid not in ids_unicos_set:
        ids_unicos_set.add(uid)
        ids_unicos_lista.append(uid)
total_clientes_unicos = len(ids_unicos_lista)

# IDs recurrentes (global, sin filtro de mes)
ids_rec_global = set()
for uid, cnt in conteo_id.items():
    if cnt > 1:
        ids_rec_global.add(uid)

# Tasa de recompra
total_ids_global = 0
for _ in conteo_id:
    total_ids_global += 1
tasa_recompra = (len(ids_rec_global) / total_ids_global * 100) if total_ids_global else 0

# Conteos recurrentes/nuevos uno a uno en el filtro actual
cnt_rec = 0; cnt_new = 0
ven_rec = 0.0; ven_new = 0.0
gan_rec = 0.0; gan_new = 0.0
for _, row in dff.iterrows():
    if row["recurrencia"] == "Recurrente":
        cnt_rec += 1
        ven_rec += row["total_pagado-cliente"]
        gan_rec += row["ganancia"]
    else:
        cnt_new += 1
        ven_new += row["total_pagado-cliente"]
        gan_new += row["ganancia"]

# Facturas cliente vs distribuidor uno a uno
fc = 0
for _, _ in dff_cli.iterrows():
    fc += 1
fd = 0
for _, _ in dff_dis.iterrows():
    fd += 1

# KPIs financieros
ingreso_bruto   = 0.0
total_propinas  = 0.0
total_envios    = 0.0
total_ganancia  = 0.0
paquetes_cli    = 0
paquetes_dis    = 0

for _, row in dff.iterrows():
    ingreso_bruto  += row["total_pagado-cliente"]
    total_propinas += row["propina"]
    total_envios   += row["envio"]
    total_ganancia += row["ganancia"]

for _, row in dff_cli.iterrows():
    paquetes_cli += int(row["paquetes"])
for _, row in dff_dis.iterrows():
    paquetes_dis += int(row["paquetes"])

ganancia_neta = total_propinas + total_ganancia + total_envios
prom_ingresos = ingreso_bruto / n_meses if n_meses else 0

# ── Promedio de pedidos por mes ──────────────────────────────────────────────
pedidos_por_mes = {}
for _, row in dff.iterrows():
    m = row["mes"]
    pedidos_por_mes[m] = pedidos_por_mes.get(m, 0) + 1

prom_pedidos_mes = 0.0
if len(pedidos_por_mes) > 0:
    total_ped_suma = 0
    for v in pedidos_por_mes.values():
        total_ped_suma += v
    prom_pedidos_mes = total_ped_suma / len(pedidos_por_mes)

# ════════════════════════════════════════════════════════════════════════════
# HEADER
# ════════════════════════════════════════════════════════════════════════════
st.markdown("# 🍬 Dashboard Hosti — Análisis de Ventas")
st.caption(
    f"Conteo exacto fila a fila · "
    f"**{total_facturas} facturas** · **{total_clientes_unicos} clientes únicos** "
    f"(IDs contados uno a uno)"
)
st.markdown("---")

# ════════════════════════════════════════════════════════════════════════════
# 1. KPIs GLOBALES
# ════════════════════════════════════════════════════════════════════════════
st.markdown("## 📊 KPIs Globales")

k = st.columns(4)
k[0].metric("📦 Facturas (exacto)",       f"{total_facturas}")
k[1].metric("👥 Clientes únicos (exacto)", f"{total_clientes_unicos}")
k[2].metric("💰 Ingreso Bruto",            f"${ingreso_bruto:,.0f}")
k[3].metric("🎁 Total Propinas",           f"${total_propinas:,.0f}")

k2 = st.columns(4)
k2[0].metric("📈 Ganancia Neta", f"${ganancia_neta:,.0f}",
             help="Propina + Ganancia + Envío")
k2[1].metric("📅 Prom. Ingreso/Mes", f"${prom_ingresos:,.0f}",
             help=f"Ingreso acumulado ÷ {n_meses} meses en el documento")
k2[2].metric("🔁 Tasa Recompra", f"{tasa_recompra:.1f}%",
             help="IDs con más de 1 compra ÷ total IDs únicos")
k2[3].metric("📦 Paquetes Totales", f"{paquetes_cli + paquetes_dis}")

k3 = st.columns(4)
k3[0].metric("🛒 Prom. Pedidos/Mes", f"{prom_pedidos_mes:.1f}",
             help=f"Total pedidos ÷ {len(pedidos_por_mes)} meses con actividad")

st.markdown("---")

# ════════════════════════════════════════════════════════════════════════════
# 2. CLIENTES vs DISTRIBUIDOR
# ════════════════════════════════════════════════════════════════════════════
st.markdown("## 🏷️ Clientes vs Distribuidor (Camila)")

col_a, col_b, col_c = st.columns(3)

with col_a:
    st.markdown("### 👤 Clientes")
    ing_cli = 0.0; gan_cli_sum = 0.0
    for _, row in dff_cli.iterrows():
        ing_cli += row["total_pagado-cliente"]
        gan_cli_sum += row["ganancia"]
    st.metric("Facturas (exacto)", fc)
    st.metric("Ingreso", f"${ing_cli:,.0f}")
    st.metric("Ganancia", f"${gan_cli_sum:,.0f}")
    st.metric("Paquetes vendidos", paquetes_cli)

with col_b:
    st.markdown("### 🏭 Distribuidor (Camila)")
    ing_dis = 0.0; gan_dis_sum = 0.0
    for _, row in dff_dis.iterrows():
        ing_dis += row["total_pagado-cliente"]
        gan_dis_sum += row["ganancia"]
    st.metric("Facturas (exacto)", fd)
    st.metric("Ingreso", f"${ing_dis:,.0f}")
    st.metric("Ganancia", f"${gan_dis_sum:,.0f}")
    st.metric("Paquetes vendidos", paquetes_dis)

with col_c:
    st.markdown("### 🔁 Recurrencia")
    total_ped = cnt_rec + cnt_new
    pct_rec = cnt_rec / total_ped * 100 if total_ped else 0
    pct_new = cnt_new / total_ped * 100 if total_ped else 0
    st.metric("Pedidos Recurrentes", cnt_rec, f"{pct_rec:.1f}%")
    st.metric("Ventas Recurrentes",  f"${ven_rec:,.0f}")
    st.metric("Pedidos Nuevos",      cnt_new, f"{pct_new:.1f}%")
    st.metric("Ventas Nuevos",       f"${ven_new:,.0f}")

# Gráfico paquetes por mes
st.markdown("#### 📦 Paquetes vendidos por Mes — Clientes vs Distribuidor")
paq_mes = dff.groupby(["mes","mes_orden","tipo"])["paquetes"].sum().reset_index().sort_values("mes_orden")
fig_paq = px.bar(paq_mes, x="mes", y="paquetes", color="tipo", barmode="group",
                 color_discrete_map={"Cliente":"#4f8ef7","Distribuidor":"#e84393"},
                 labels={"paquetes":"Paquetes","mes":"Mes"},
                 category_orders={"mes": meses_doc})
fig_paq.update_layout(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
st.plotly_chart(fig_paq, use_container_width=True)

st.markdown("---")

# ════════════════════════════════════════════════════════════════════════════
# 3. MARGEN POR PRODUCTO
# ════════════════════════════════════════════════════════════════════════════
st.markdown("## 🧮 Margen por Producto")

filas_mg = []
for mg in [5, 10, 30, 60]:
    costo   = COSTO_PROD[mg]
    p_ini   = PRECIO_INICIAL[mg]
    p_des   = PRECIO_DESCUENTO[mg]
    g_ini   = p_ini - costo
    g_des   = p_des - costo
    filas_mg.append({
        "Producto":              f"{mg} mg",
        "Costo Prod.":           costo,
        "Precio Inicial":        p_ini,
        "Gan. Inicial ($)":      g_ini,
        "Margen Inicial (%)":    round(g_ini / p_ini * 100, 1),
        "Precio Descuento":      p_des,
        "Gan. Descuento ($)":    g_des,
        "Margen Descuento (%)":  round(g_des / p_des * 100, 1),
    })
# Fila distribuidor (costo especial 5302)
filas_mg.append({
    "Producto":              "60 mg (Dist.)",
    "Costo Prod.":           COSTO_DIST,
    "Precio Inicial":        PRECIO_DIST,
    "Gan. Inicial ($)":      PRECIO_DIST - COSTO_DIST,
    "Margen Inicial (%)":    round((PRECIO_DIST - COSTO_DIST) / PRECIO_DIST * 100, 1),
    "Precio Descuento":      PRECIO_DIST,
    "Gan. Descuento ($)":    PRECIO_DIST - COSTO_DIST,
    "Margen Descuento (%)":  round((PRECIO_DIST - COSTO_DIST) / PRECIO_DIST * 100, 1),
})

df_mg = pd.DataFrame(filas_mg)
st.dataframe(df_mg, use_container_width=True)

col_g1, col_g2 = st.columns(2)

with col_g1:
    st.markdown("#### 💵 Margen con Precio Inicial")
    fig_ini = go.Figure()
    fig_ini.add_bar(name="Precio Inicial",    x=df_mg["Producto"], y=df_mg["Precio Inicial"],
                    marker_color="#4f8ef7", opacity=0.85)
    fig_ini.add_bar(name="Costo Producción",  x=df_mg["Producto"], y=df_mg["Costo Prod."],
                    marker_color="#f7a44f", opacity=0.85)
    fig_ini.add_trace(go.Scatter(x=df_mg["Producto"], y=df_mg["Margen Inicial (%)"],
                                 name="Margen %", yaxis="y2", mode="lines+markers",
                                 line=dict(color="#2ca02c", width=3),
                                 marker=dict(size=10, symbol="diamond")))
    fig_ini.update_layout(
        barmode="overlay",
        yaxis=dict(title="Precio ($)"),
        yaxis2=dict(title="Margen (%)", overlaying="y", side="right"),
        plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
        legend=dict(orientation="h", y=-0.25)
    )
    st.plotly_chart(fig_ini, use_container_width=True)

with col_g2:
    st.markdown("#### 🏷️ Margen con Precio Descuento")
    fig_des = go.Figure()
    fig_des.add_bar(name="Precio Descuento",  x=df_mg["Producto"], y=df_mg["Precio Descuento"],
                    marker_color="#e84393", opacity=0.85)
    fig_des.add_bar(name="Costo Producción",  x=df_mg["Producto"], y=df_mg["Costo Prod."],
                    marker_color="#f7a44f", opacity=0.85)
    fig_des.add_trace(go.Scatter(x=df_mg["Producto"], y=df_mg["Margen Descuento (%)"],
                                 name="Margen %", yaxis="y2", mode="lines+markers",
                                 line=dict(color="#d62728", width=3),
                                 marker=dict(size=10, symbol="diamond")))
    fig_des.update_layout(
        barmode="overlay",
        yaxis=dict(title="Precio ($)"),
        yaxis2=dict(title="Margen (%)", overlaying="y", side="right"),
        plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
        legend=dict(orientation="h", y=-0.25)
    )
    st.plotly_chart(fig_des, use_container_width=True)

st.markdown("---")

# ════════════════════════════════════════════════════════════════════════════
# 4. VENTAS Y GANANCIAS POR MES — RECURRENTES vs NUEVOS
# ════════════════════════════════════════════════════════════════════════════
st.markdown("## 📅 Ventas y Ganancias por Mes — Recurrentes vs Nuevos")

ventas_mes = (dff.groupby(["mes","mes_orden","recurrencia"])["total_pagado-cliente"]
              .sum().reset_index().sort_values("mes_orden"))
fig_vm = px.bar(ventas_mes, x="mes", y="total_pagado-cliente", color="recurrencia",
                barmode="group",
                color_discrete_map={"Recurrente":"#4f8ef7","Nuevo":"#f76f4f"},
                labels={"total_pagado-cliente":"Ventas ($)","mes":"Mes","recurrencia":"Tipo"},
                title="💵 Ventas por Mes — Recurrentes vs Nuevos",
                category_orders={"mes": meses_doc})
fig_vm.update_layout(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
st.plotly_chart(fig_vm, use_container_width=True)

gan_mes = (dff.groupby(["mes","mes_orden","recurrencia"])["ganancia"]
           .sum().reset_index().sort_values("mes_orden"))
fig_gm = px.bar(gan_mes, x="mes", y="ganancia", color="recurrencia",
                barmode="group",
                color_discrete_map={"Recurrente":"#2ca02c","Nuevo":"#d62728"},
                labels={"ganancia":"Ganancia ($)","mes":"Mes","recurrencia":"Tipo"},
                title="📈 Ganancias por Mes — Recurrentes vs Nuevos",
                category_orders={"mes": meses_doc})
fig_gm.update_layout(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
st.plotly_chart(fig_gm, use_container_width=True)

st.markdown("---")

# ════════════════════════════════════════════════════════════════════════════
# 5. ACUMULATIVO POR MES
# ════════════════════════════════════════════════════════════════════════════
st.markdown("## 📈 Acumulativo de Ingresos por Mes")

acu = (dff.groupby(["mes","mes_orden"])["total_pagado-cliente"]
       .sum().reset_index().sort_values("mes_orden"))
acu["Acumulado"] = acu["total_pagado-cliente"].cumsum()

fig_acu = go.Figure()
fig_acu.add_bar(x=acu["mes"], y=acu["total_pagado-cliente"],
                name="Ingresos del Mes", marker_color="#4f8ef7")
fig_acu.add_scatter(x=acu["mes"], y=acu["Acumulado"],
                    name="Acumulado", mode="lines+markers", yaxis="y2",
                    line=dict(color="#ff7f0e", width=3), marker=dict(size=10))
fig_acu.update_layout(
    title="Ingresos mensuales + línea acumulada",
    yaxis=dict(title="Ingresos Mes ($)"),
    yaxis2=dict(title="Acumulado ($)", overlaying="y", side="right"),
    plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
    legend=dict(orientation="h", y=-0.2)
)
st.plotly_chart(fig_acu, use_container_width=True)

st.markdown("---")

# ════════════════════════════════════════════════════════════════════════════
# 6. PEDIDOS POR DÍA Y MES
# ════════════════════════════════════════════════════════════════════════════
st.markdown("## 📆 Pedidos por Día y Mes")

# Conteo exacto uno a uno por día y mes
conteo_dia = {}
for _, row in dff.iterrows():
    k_dia = (row["mes"], int(row["dia"]))
    conteo_dia[k_dia] = conteo_dia.get(k_dia, 0) + 1

registros_dia = [{"mes": k[0], "dia": k[1], "pedidos": v} for k, v in conteo_dia.items()]
df_dia = pd.DataFrame(registros_dia)
df_dia["mes_orden"] = df_dia["mes"].apply(lambda m: ORDEN_MESES.index(m) if m in ORDEN_MESES else 99)
df_dia = df_dia.sort_values(["mes_orden","dia"])

pivot = df_dia.pivot_table(index="mes", columns="dia", values="pedidos", fill_value=0)
pivot = pivot.reindex([m for m in meses_doc if m in pivot.index])
fig_heat = px.imshow(pivot,
                     title="🗓️ Heatmap: Pedidos por Día y Mes",
                     labels=dict(x="Día", y="Mes", color="Pedidos"),
                     color_continuous_scale="Blues", aspect="auto")
fig_heat.update_layout(paper_bgcolor="rgba(0,0,0,0)")
st.plotly_chart(fig_heat, use_container_width=True)

# Bar total por día
conteo_solo_dia = {}
for _, row in dff.iterrows():
    d = int(row["dia"])
    conteo_solo_dia[d] = conteo_solo_dia.get(d, 0) + 1

df_bdia = pd.DataFrame(sorted(conteo_solo_dia.items()), columns=["dia","pedidos"])
fig_bdia = px.bar(df_bdia, x="dia", y="pedidos",
                  title="📊 Pedidos totales por Día (todos los meses)",
                  labels={"dia":"Día del Mes","pedidos":"Pedidos"},
                  color="pedidos", color_continuous_scale="Blues")
fig_bdia.update_layout(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
st.plotly_chart(fig_bdia, use_container_width=True)

st.markdown("---")

# ════════════════════════════════════════════════════════════════════════════
# 7. MARGEN GANANCIA POR MES — DISTRIBUIDOR vs CLIENTES
# ════════════════════════════════════════════════════════════════════════════
st.markdown("## 🏭 Margen de Ganancia por Mes — Distribuidor vs Clientes")

mg_tipo = (dff.groupby(["mes","mes_orden","tipo"])
           .agg(ganancia=("ganancia","sum"), ingresos=("total_pagado-cliente","sum"))
           .reset_index().sort_values("mes_orden"))
mg_tipo["margen_%"] = (mg_tipo["ganancia"] / mg_tipo["ingresos"].replace(0, 1) * 100).round(1)

col_m1, col_m2 = st.columns(2)
with col_m1:
    fig_mp = px.bar(mg_tipo, x="mes", y="margen_%", color="tipo", barmode="group",
                    title="📊 Margen % por Mes",
                    color_discrete_map={"Cliente":"#4f8ef7","Distribuidor":"#e84393"},
                    labels={"margen_%":"Margen (%)","mes":"Mes"},
                    category_orders={"mes": meses_doc})
    fig_mp.update_layout(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig_mp, use_container_width=True)

with col_m2:
    fig_mg2 = px.bar(mg_tipo, x="mes", y="ganancia", color="tipo", barmode="group",
                     title="💵 Ganancia $ por Mes",
                     color_discrete_map={"Cliente":"#2ca02c","Distribuidor":"#d62728"},
                     labels={"ganancia":"Ganancia ($)","mes":"Mes"},
                     category_orders={"mes": meses_doc})
    fig_mg2.update_layout(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig_mg2, use_container_width=True)

st.markdown("---")

# ════════════════════════════════════════════════════════════════════════════
# 8. MARGEN PEDIDOS — RECURRENTES vs NUEVOS
# ════════════════════════════════════════════════════════════════════════════
st.markdown("## 🔁 Margen de Pedidos: Recurrentes vs Nuevos")

col_p1, col_p2, col_p3, col_p4 = st.columns(4)
col_p1.metric("% Pedidos Recurrentes",  f"{pct_rec:.1f}%",  f"{cnt_rec} pedidos")
col_p2.metric("% Pedidos Nuevos",       f"{pct_new:.1f}%",  f"{cnt_new} pedidos")
col_p3.metric("Ventas Recurrentes",     f"${ven_rec:,.0f}")
col_p4.metric("Ventas Nuevos",          f"${ven_new:,.0f}")

col_m_rec = gan_rec / ven_rec * 100 if ven_rec else 0
col_m_new = gan_new / ven_new * 100 if ven_new else 0
st.caption(f"Margen ganancia recurrentes: **{col_m_rec:.1f}%** · "
           f"Margen ganancia nuevos: **{col_m_new:.1f}%**")

cp1, cp2 = st.columns(2)
with cp1:
    fig_pie1 = px.pie(
        names=["Recurrente","Nuevo"], values=[cnt_rec, cnt_new],
        title="🥧 % Pedidos: Recurrentes vs Nuevos",
        color_discrete_sequence=["#4f8ef7","#f76f4f"]
    )
    st.plotly_chart(fig_pie1, use_container_width=True)
with cp2:
    fig_pie2 = px.pie(
        names=["Recurrente","Nuevo"], values=[ven_rec, ven_new],
        title="💰 % Ventas: Recurrentes vs Nuevos",
        color_discrete_sequence=["#2ca02c","#d62728"]
    )
    st.plotly_chart(fig_pie2, use_container_width=True)

st.markdown("---")

# ════════════════════════════════════════════════════════════════════════════
# 10. CANTIDAD DE PEDIDOS POR MES
# ════════════════════════════════════════════════════════════════════════════
st.markdown("## 🗓️ Cantidad de Pedidos por Mes")

# Conteo exacto uno a uno por mes
pedidos_mes_lista = []
for m, cnt_m in sorted(pedidos_por_mes.items(), key=lambda x: ORDEN_MESES.index(x[0]) if x[0] in ORDEN_MESES else 99):
    pedidos_mes_lista.append({"mes": m, "pedidos": cnt_m})

df_ped_mes = pd.DataFrame(pedidos_mes_lista)

col_pm1, col_pm2 = st.columns(2)

with col_pm1:
    fig_ped_mes = px.bar(
        df_ped_mes, x="mes", y="pedidos",
        title="📦 Pedidos por Mes",
        labels={"mes": "Mes", "pedidos": "Cantidad de Pedidos"},
        color="pedidos", color_continuous_scale="Blues",
        category_orders={"mes": meses_doc}
    )
    fig_ped_mes.update_layout(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig_ped_mes, use_container_width=True)

with col_pm2:
    # Línea de tendencia de pedidos por mes
    fig_trend = go.Figure()
    fig_trend.add_bar(
        x=df_ped_mes["mes"], y=df_ped_mes["pedidos"],
        name="Pedidos", marker_color="#4f8ef7", opacity=0.7
    )
    # Línea de promedio
    fig_trend.add_hline(
        y=prom_pedidos_mes, line_dash="dash",
        line_color="#e84393", line_width=2,
        annotation_text=f"Prom: {prom_pedidos_mes:.1f}",
        annotation_position="top right"
    )
    fig_trend.update_layout(
        title=f"📈 Pedidos por Mes + Promedio ({prom_pedidos_mes:.1f})",
        xaxis_title="Mes",
        yaxis_title="Pedidos",
        plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)"
    )
    st.plotly_chart(fig_trend, use_container_width=True)

# Tabla resumen pedidos por mes
st.markdown("#### 📋 Resumen de Pedidos por Mes")
df_ped_mes_display = df_ped_mes.copy()
df_ped_mes_display["vs promedio"] = df_ped_mes_display["pedidos"].apply(
    lambda v: f"+{v - prom_pedidos_mes:.1f}" if v >= prom_pedidos_mes else f"{v - prom_pedidos_mes:.1f}"
)
st.dataframe(df_ped_mes_display, use_container_width=True)

st.markdown("---")

# ════════════════════════════════════════════════════════════════════════════
# 9. TABLA DETALLE
# ════════════════════════════════════════════════════════════════════════════
st.markdown("## 📋 Detalle de Registros")

# Contar UNO A UNO para el caption
n_exacto = 0
for _, _ in dff.iterrows():
    n_exacto += 1

st.caption(
    f"Mostrando **{n_exacto} facturas** (contadas una a una) · "
    f"**{total_clientes_unicos} clientes únicos** (IDs contados uno a uno)"
)
st.dataframe(
    dff.drop(columns=["mes_orden","veces_compra"]).reset_index(drop=True),
    use_container_width=True
)

st.markdown("---")
st.caption("Dashboard Hosti 🍬 · Todos los conteos son exactos — iteración fila a fila sin riesgo de agrupación incorrecta")
