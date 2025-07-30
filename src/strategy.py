# src/strategy.py

# Esta función calcula los parámetros del trade basado en la acción y el nivel de rechazo.
def calculate_trade_parameters(action, entry_price, rejection_level):
    """
    Calcula el Stop Loss y el Take Profit para una propuesta de trade.
    El ratio Riesgo/Beneficio está fijado en 1:1.7.
    """
    if action == "SHORT":
        stop_loss = rejection_level * 1.001
        risk = stop_loss - entry_price
        if risk <= 0: return None, None
        take_profit = entry_price - (risk * 1.7)
    elif action == "LONG":
        stop_loss = rejection_level * 0.999
        risk = entry_price - stop_loss
        if risk <= 0: return None, None
        take_profit = entry_price + (risk * 1.7)
    else:
        return None, None
        
    return stop_loss, take_profit

# Esta es tu función de estrategia principal, sin modificaciones.
def check_strategy_logic(state, current_candle, prev_candle, sml_pivots):
    """
    Función central de la lógica de trading. Procesa el estado actual y los datos
    de mercado para determinar el nuevo estado y posibles acciones de trading.
    """
    new_state = state.copy()
    trade_proposal = None
    reasoning = "Observando mercado..."

    # Extraer datos para legibilidad
    current_price, current_high, current_low = current_candle['close'], current_candle['high'], current_candle['low']
    current_rsi, current_ema = current_candle['rsi_14'], current_candle['ema_12']
    prev_close, prev_ema = prev_candle['close'], prev_candle['ema_12']
    
    status = state.get('status', 'IDLE')

    if status == 'IDLE':
        if current_high >= sml_pivots.get('high', float('inf')):
            new_state = {"status": "FOUND_FIRST_HIGH", "price": current_high, "rsi": current_rsi, "rejection_level": sml_pivots['high']}
            reasoning = f"Primer pico alto detectado en {current_high:.2f}"
        elif current_low <= sml_pivots.get('low', 0):
            new_state = {"status": "FOUND_FIRST_LOW", "price": current_low, "rsi": current_rsi, "rejection_level": sml_pivots['low']}
            reasoning = f"Primer pico bajo detectado en {current_low:.2f}"
    
    elif status == 'FOUND_FIRST_HIGH':
        rejection_level = state.get("rejection_level")
        if current_high > state.get("price") and current_rsi < state.get("rsi"):
            new_state["status"] = "WATCHING_SHORT"
            new_state["rejection_level"] = max(rejection_level, current_high) # Actualizar al nuevo máximo
            reasoning = "Divergencia bajista confirmada. Vigilando SHORT."
        elif current_price < rejection_level:
            new_state = {"status": "IDLE", "reasoning": "Búsqueda de divergencia invalidada."}

    elif status == 'FOUND_FIRST_LOW':
        rejection_level = state.get("rejection_level")
        if current_low < state.get("price") and current_rsi > state.get("rsi"):
            new_state["status"] = "WATCHING_LONG"
            new_state["rejection_level"] = min(rejection_level, current_low) # Actualizar al nuevo mínimo
            reasoning = "Divergencia alcista confirmada. Vigilando LONG."
        elif current_price > rejection_level:
            new_state = {"status": "IDLE", "reasoning": "Búsqueda de divergencia invalidada."}

    elif status == 'WATCHING_SHORT':
        rejection_level = state.get("rejection_level")
        if current_high > rejection_level * 1.001:
            new_state = {"status": "IDLE", "reasoning": "Setup SHORT invalidado (precio superó resistencia)."}
        elif prev_close > prev_ema and current_price < current_ema:
            entry_price = current_price
            sl, tp = calculate_trade_parameters('SHORT', entry_price, rejection_level)
            if sl is not None:
                trade_proposal = {'type': 'SHORT', 'entry': entry_price, 'stop_loss': sl, 'target': tp}
                new_state = {"status": "IDLE", "reasoning": "Propuesta de SHORT enviada."}
            else:
                new_state = {"status": "IDLE", "reasoning": "Error de cálculo de riesgo, trade abortado."}
        else:
            reasoning = "Vigilando SHORT. Esperando cruce bajista de EMA12."

    elif status == 'WATCHING_LONG':
        rejection_level = state.get("rejection_level")
        if current_low < rejection_level * 0.999:
            new_state = {"status": "IDLE", "reasoning": "Setup LONG invalidado (precio rompió soporte)."}
        elif prev_close < prev_ema and current_price > current_ema:
            entry_price = current_price
            sl, tp = calculate_trade_parameters('LONG', entry_price, rejection_level)
            if sl is not None:
                trade_proposal = {'type': 'LONG', 'entry': entry_price, 'stop_loss': sl, 'target': tp}
                new_state = {"status": "IDLE", "reasoning": "Propuesta de LONG enviada."}
            else:
                new_state = {"status": "IDLE", "reasoning": "Error de cálculo de riesgo, trade abortado."}
        else:
            reasoning = "Vigilando LONG. Esperando cruce alcista de EMA12."
            
    if 'reasoning' not in new_state:
        new_state['reasoning'] = reasoning

    return new_state, trade_proposal