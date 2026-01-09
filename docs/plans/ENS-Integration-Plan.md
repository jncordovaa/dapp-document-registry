# Registrar ENS en Sepolia con Foundry

Este script te permite registrar un nombre ENS (.eth) en la testnet de Sepolia usando Foundry.

## Prerrequisitos

1. **SepoliaETH**: Necesitas al menos 0.01 SepoliaETH en tu wallet
   - Faucets: https://sepoliafaucet.com/ o https://www.infura.io/faucet/sepolia

2. **Credenciales**: Puedes usar cualquiera de estas opciones:
   - **OPCIÓN 1 (Recomendada)**: Mnemonic (frase semilla de 12/24 palabras)
   - **OPCIÓN 2**: Private Key directa

## Pasos para Registrar

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en el directorio `sc/`:

```bash
cd sc
cp .env.sepolia.example .env
```

Edita el archivo `.env` con tus datos:

**OPCIÓN 1: Usando Mnemonic (Recomendado)**
```env
# ⚠️ NEVER commit this file - keep it local only
MNEMONIC="your twelve word mnemonic phrase here"
MNEMONIC_INDEX=0
ENS_NAME=yourname
ENS_SECRET=<your-random-secret-here>
SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

**OPCIÓN 2: Usando Private Key**
```env
# ⚠️ NEVER commit this file - keep it local only
PRIVATE_KEY=0x<your_private_key_here>
ENS_NAME=yourname
ENS_SECRET=<your-random-secret-here>
SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

**Importante**:
- `ENS_NAME` debe ser sin el `.eth` (ejemplo: `alice`, no `alice.eth`)
- `ENS_SECRET`: Usa un string único y difícil de adivinar (previene front-running)
  - ✅ BUENO: "my-random-salt-xyz-789-abc-2024"
  - ❌ MALO: "123" o "secret" (muy predecibles)
  - CRÍTICO: NO cambies este valor entre step 1 (commitment) y step 2 (register)
- `MNEMONIC_INDEX`: 0 para la primera cuenta, 1 para la segunda, etc.
- Puedes usar el mismo mnemonic de MetaMask
- Asegúrate de tener SepoliaETH en esa wallet

### 2. Paso 1 - Enviar Commitment (Compromiso)

```bash
cd sc

  forge script script/RegisterENS.s.sol:RegisterENS \
    --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
    --broadcast \
    --legacy \
    --slow \
    -vvv
```

Este comando:
- Crea un commitment para tu nombre ENS
- Lo envía a la blockchain
- Te muestra el precio del registro
- Te indica que esperes ~60 segundos

**Salida esperada**:
```
Registering ENS name for address: 0x...
ENS Name: alice
Commitment created: 0x...
=== STEP 1: Sending commitment ===
Commitment sent! Transaction confirmed.
Registration price: 1000000000000 (wei)
Min commitment age: 60 seconds

  Using mnemonic (account index: 1 )
  Registering ENS name for address: 0x61f1365F2DF858161A3a127C8533C43f88AA3A8e
  ENS Name: jncordovaa
  Commitment created:
  0xfd570d97c9a05e372ce3fc357713a17d3fce8c70d67a85bc037cfc74d55e2c25

=== STEP 1: Sending commitment ===
  Commitment sent! Transaction confirmed.

Registration price: 3125000000003490

=== IMPORTANT ===
Wait at least 60 seconds before running the register step.
```

### 3. Esperar 60 Segundos

⏰ **IMPORTANTE**: Debes esperar al menos 60 segundos (1 minuto) antes del siguiente paso.

### 4. Paso 2 - Completar Registro

Después de esperar 60+ segundos, ejecuta:

```bash
forge script script/RegisterENS.s.sol:RegisterENS \
    --sig "completeRegistration()" \
    --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
    --broadcast \
    --legacy \
    --slow \
    -vvv
```

Este comando:
- Completa el registro del nombre ENS
- Configura el resolver
- Establece el reverse record (tu dirección → nombre ENS)

**Salida esperada**:
```
=== STEP 2: Completing registration ===
Owner: 0x...
ENS Name: alice
Registration price: 1000000000000
Sending value: 1100000000000
=== SUCCESS ===
ENS name registered successfully!
Your ENS: alice.eth
Owner: 0x...
```

### 5. Verificar Registro

forge script script/RegisterENS.s.sol:RegisterENS --sig "verifyRegistration()" --rpc-url https://ethereum-sepolia-rpc.publicnode.com

si no se asocia correcta mente EL ENS con tu dirección ejecutar:

forge script script/SetENSAddress.s.sol:SetENSAddress \
    --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
    --broadcast \
    --legacy \
    --slow

Verifica tu ENS en Sepolia Etherscan:
```
https://sepolia.etherscan.io/enslookup-search?search=tunombre.eth
```

O busca tu dirección y deberías ver tu nombre ENS asociado:
```
https://sepolia.etherscan.io/address/0xTU_ADDRESS
```

## Probar en tu dApp

Una vez registrado, prueba en tu aplicación:

1. **DocumentVerifier**:
   - Ingresa `tunombre.eth` en lugar de `0x...`
   - Debería resolver correctamente

2. **DocumentHistory & DocumentSigner**:
   - Deberías ver `tunombre.eth (0x123...)` en lugar de solo la dirección

## Troubleshooting

### Error: "Insufficient funds"
- Necesitas más SepoliaETH. Usa un faucet.

### Error: "Commitment too new"
- No esperaste los 60 segundos. Espera más tiempo y reintenta el paso 2.

### Error: "Commitment too old"
- Esperaste demasiado (>24 horas). Vuelve a ejecutar el paso 1.

### Error: "Name not available"
- El nombre ya está registrado. Elige otro nombre.

## Notas

- El registro dura **1 año** (configurable en el script)
- Puedes registrar múltiples nombres cambiando `ENS_NAME` en `.env`
- El `secret` en el script debe ser el mismo en ambos pasos
- El script incluye 10% extra en el pago por seguridad

## Contratos ENS en Sepolia

- **ETH Registrar Controller**: `0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72`
- **Public Resolver**: `0x8FADE66B79cC9f707aB26799354482EB93a5B7dD`

## Cómo Obtener tu Mnemonic de MetaMask

1. Abre MetaMask
2. Haz clic en los 3 puntos (⋮) → **Settings** → **Security & Privacy**
3. Haz clic en **"Reveal Secret Recovery Phrase"**
4. Ingresa tu contraseña de MetaMask
5. Copia las 12 palabras (tu mnemonic)
6. Pégalas en el archivo `.env`:
   ```env
   MNEMONIC="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
   ```

**⚠️ SEGURIDAD**:
- ✅ El archivo `.env` está en `.gitignore` (no se sube a GitHub)
- ❌ NUNCA compartas tu mnemonic
- ❌ NUNCA lo subas a repositorios públicos
- ✅ Úsalo solo para testnets, no para wallets con fondos reales en mainnet
