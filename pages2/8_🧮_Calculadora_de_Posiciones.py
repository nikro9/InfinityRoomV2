# pages/7_🧮_Calculadora_de_Posiciones.py
import streamlit as st

st.set_page_config(layout="wide", page_title="Calculadora de Posiciones")

st.title("🧮 Calculadora de Tamaño de Posición")
st.markdown("Calcula el tamaño de tu operación basado en el capital y el riesgo que estás dispuesto a asumir.")
st.markdown("---")

# --- ENTRADAS DEL USUARIO ---
st.subheader("Parámetros de la Operación")

col1, col2, col3 = st.columns(3)

with col1:
    capital_total = st.number_input("Capital Total de la Cuenta ($)", min_value=0.0, value=10000.0, step=100.0)
    riesgo_porcentaje = st.slider("Riesgo por Operación (%)", min_value=0.1, max_value=10.0, value=1.0, step=0.1)

with col2:
    precio_entrada = st.number_input("Precio de Entrada", min_value=0.0, value=70000.0, step=1.0, format="%.2f")
    precio_stop_loss = st.number_input("Precio de Stop Loss", min_value=0.0, value=69500.0, step=1.0, format="%.2f")

with col3:
    st.write("") # Espacio para alinear
    ratio_riesgo_beneficio = st.number_input("Ratio Riesgo/Beneficio", min_value=0.1, value=1.7, step=0.1)


# --- CÁLCULOS ---
if precio_entrada > 0 and precio_stop_loss > 0 and capital_total > 0:
    
    riesgo_en_dolares = capital_total * (riesgo_porcentaje / 100)
    distancia_sl_por_unidad = abs(precio_entrada - precio_stop_loss)
    
    if distancia_sl_por_unidad > 0:
        tamano_posicion_unidades = riesgo_en_dolares / distancia_sl_por_unidad
        tamano_posicion_dolares = tamano_posicion_unidades * precio_entrada
        
        # Calcular Take Profit
        riesgo_por_unidad_tp = abs(precio_entrada - precio_stop_loss)
        if precio_entrada > precio_stop_loss: # Long
            precio_take_profit = precio_entrada + (riesgo_por_unidad_tp * ratio_riesgo_beneficio)
        else: # Short
            precio_take_profit = precio_entrada - (riesgo_por_unidad_tp * ratio_riesgo_beneficio)

        st.markdown("---")
        st.subheader("Resultados del Cálculo")
        
        res1, res2, res3 = st.columns(3)
        with res1:
            st.metric("Riesgo Máximo por Trade", f"${riesgo_en_dolares:,.2f}")
        with res2:
            st.metric("Tamaño de la Posición (en activo)", f"{tamano_posicion_unidades:,.4f}")
            st.metric("Tamaño de la Posición (en USD)", f"${tamano_posicion_dolares:,.2f}")
        with res3:
            st.metric("Precio de Take Profit Sugerido", f"${precio_take_profit:,.2f}")

    else:
        st.warning("El precio de entrada y el Stop Loss no pueden ser iguales.")
else:
    st.info("Ingresa los parámetros de tu operación para calcular el tamaño de la posición.")