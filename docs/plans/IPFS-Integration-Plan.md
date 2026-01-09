# Plan: Integración de IPFS para Almacenamiento de Documentos

## 📊 ESTADO DE IMPLEMENTACIÓN

**Última actualización:** 2025-12-28 18:30

### Estado General: ✅ IMPLEMENTADO (90%)

La integración IPFS ha sido **completada exitosamente** usando **Pinata** como proveedor de servicio IPFS. El sistema permite subir, almacenar y recuperar documentos desde IPFS con el CID almacenado en blockchain.

### Desglose por Componente

| Componente | Estado | Completado | Notas |
|------------|--------|------------|-------|
| **Smart Contract** | ✅ Completado | 100% | Desplegado en Anvil |
| └─ Campo `ipfsCid` en struct | ✅ Implementado | 100% | mixedCase aplicado |
| └─ Parámetro CID en `storeDocumentHash()` | ✅ Implementado | 100% | 5º parámetro `string _ipfsCid` |
| └─ Función `getDocumentCid()` | ✅ Implementado | 100% | Nueva función getter |
| └─ Tests de funcionalidad IPFS | ✅ Completado | 100% | 5 tests nuevos, 16/16 passing |
| **Frontend** | ✅ Completado | 95% | Funcional en Anvil |
| └─ Archivo `dapp/utils/ipfs.ts` | ✅ Implementado | 100% | Con Pinata SDK v2.5.2 |
| └─ Dependencia `pinata` | ✅ Instalado | 100% | Reemplazó web3.storage |
| └─ Integración en `FileUploader.tsx` | ✅ Implementado | 100% | Upload + display CID |
| └─ Integración en `DocumentSigner.tsx` | ✅ Implementado | 100% | Pasa CID al contrato |
| └─ Hook `useContract.ts` | ✅ Actualizado | 100% | ABI y funciones actualizadas |
| └─ Integración en `DocumentHistory.tsx` | ✅ Implementado | 100% | View/Download desde IPFS |
| └─ Integración en `page.tsx` | ✅ Implementado | 100% | Flujo completo conectado |
| **Configuración** | ✅ Configurado | 100% | |
| └─ Variables de entorno IPFS | ✅ Configurado | 100% | `NEXT_PUBLIC_PINATA_JWT` |
| └─ Cuenta Pinata + JWT Token | ✅ Configurado | 100% | Plan gratuito (1GB) |

### Estado por Fase

| Fase | Estado | Tiempo | Notas |
|------|--------|--------|-------|
| **Fase 1: Setup** | ✅ Completada | 30 min | Cuenta Pinata + JWT |
| **Fase 2: Smart Contract** | ✅ Completada | 2 hrs | Contrato desplegado en `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| **Fase 3: Frontend Utils** | ✅ Completada | 1 hr | `ipfs.ts` con corrección de API |
| **Fase 4: Componentes** | ✅ Completada | 3 hrs | Todos los componentes integrados |
| **Fase 5: Testing** | 🔄 En Progreso | - | Pruebas manuales exitosas |
| **Fase 6: Documentación** | ⏳ Pendiente | - | README y guías |

### Cambios Importantes vs Plan Original

1. **Proveedor IPFS:** Pinata en lugar de Web3.Storage (Web3.Storage cambió nombre a Storacha)
2. **SDK:** `pinata` v2.5.2 en lugar de `web3.storage`
3. **API Correction:** `pinata.upload.public.file()` en lugar de `pinata.upload.file()`
4. **Response Structure:** Propiedad `cid` en lugar de `IpfsHash`
5. **Naming Convention:** `ipfsCid` (mixedCase) en lugar de `ipfsCID`
6. **UI Simplification:** Solo botón "View on IPFS" (eliminado "Download File")

### Próximos Pasos

1. **Fase 5: Testing Completo** (pendiente)
   - ✅ Upload y almacenamiento en blockchain funcionando
   - ✅ Display de CID en History funcionando
   - ✅ Download/View desde IPFS funcionando
   - ⏳ Probar diferentes tipos de archivos (PDF, imágenes, texto)
   - ⏳ Probar manejo de errores (archivos grandes, red caída)
   - ⏳ Verificar integridad de archivos descargados

2. **Fase 6: Documentación** (pendiente)
   - Actualizar README con instrucciones IPFS
   - Documentar cómo recuperar documentos
   - Agregar troubleshooting de errores comunes
   - Documentar deployment a Sepolia (opcional)

### Pruebas Realizadas

- ✅ Upload de archivo → CID generado exitosamente
- ✅ Firma y almacenamiento en blockchain con CID
- ✅ Visualización de documentos en History con CID
- ✅ Download de archivo desde IPFS Gateway
- ✅ Copy CID al clipboard
- ✅ Export CSV con columna IPFS CID

**Tiempo total invertido:** ~6 horas de desarrollo

---

## Contexto Actual del Proyecto

**Estado actual:**
- Solo se almacena el **hash KECCAK256** (32 bytes) en blockchain
- El archivo completo se **pierde después del upload** (solo vive en memoria del navegador)
- No hay almacenamiento persistente de archivos
- Usuario solo puede verificar si un archivo coincide con un hash almacenado

**Problema:**
Si un usuario pierde su archivo, **no puede recuperarlo** aunque esté "registrado" en blockchain.

---

## ¿Qué es IPFS?

**IPFS (InterPlanetary File System)** es una red descentralizada de almacenamiento de archivos.

### Características clave:
- **Content-addressed**: Los archivos se identifican por su contenido (CID), no por ubicación
- **Descentralizado**: No depende de un servidor central
- **Inmutable**: El mismo contenido siempre tiene el mismo CID
- **Permanente**: Los archivos persisten mientras alguien los "pinee"
- **Eficiente**: Deduplicación automática

### CID (Content Identifier)
```
Ejemplo: QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco
```
- Similar a un hash pero con metadata adicional
- Siempre apunta al mismo contenido
- Se puede usar para recuperar el archivo desde cualquier nodo IPFS

---

## Arquitectura Propuesta: IPFS + Blockchain

```
┌─────────────────────────────────────────────────────────┐
│ USUARIO SUBE DOCUMENTO                                   │
└─────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────┴───────────────┐
        │                               │
        ↓                               ↓
┌───────────────┐              ┌──────────────┐
│ 1. IPFS       │              │ 2. BLOCKCHAIN│
│                │              │               │
│ - Almacena    │              │ - Almacena    │
│   archivo     │              │   CID         │
│   completo    │              │   hash        │
│               │              │   firma       │
│ - Retorna CID │              │   timestamp   │
│               │              │   signer      │
└───────────────┘              └──────────────┘
        │                               │
        └───────────────┬───────────────┘
                        ↓
        USUARIO PUEDE RECUPERAR EL ARCHIVO
        CON EL CID DESDE CUALQUIER NODO IPFS
```

---

## ¿Qué se necesita para implementar IPFS?

### 1. DECISIÓN: ¿Servicio gestionado o nodo propio?

#### Opción A: **Servicios Gestionados** (Recomendado para empezar)

| Servicio | Tipo | Costo | Características |
|----------|------|-------|-----------------|
| **Pinata** | Cloud IPFS | Free tier: 1GB | - API simple<br>- 1GB gratis<br>- $20/mes pro |
| **Web3.Storage** | Cloud IPFS | GRATIS | - De Protocol Labs<br>- Gratis ilimitado<br>- Muy fácil de usar |
| **NFT.Storage** | Cloud IPFS | GRATIS | - Enfocado en NFTs<br>- También funciona para docs |
| **Infura IPFS** | Cloud IPFS | Free tier: 5GB | - 5GB gratis/mes<br>- Integrado con Infura |
| **Filebase** | S3 + IPFS | Free tier: 5GB | - Compatible con S3<br>- 5GB gratis |

**Recomendación:** **Web3.Storage** (gratis, sin límites, creado por Protocol Labs)

#### Opción B: **Nodo IPFS propio**

**Pros:**
- Control total
- Sin dependencias externas
- Sin costos de almacenamiento

**Contras:**
- Requiere infraestructura (servidor 24/7)
- Mantenimiento complejo
- Costos de servidor

---

### 2. DEPENDENCIAS DE NPM NECESARIAS

#### Frontend (Next.js):
```bash
npm install ipfs-http-client
# o si usas Web3.Storage:
npm install web3.storage

# Para manejar archivos:
npm install @web3-storage/parse-link-header
```

#### Opciones de librerías:

| Librería | Uso | Tamaño |
|----------|-----|--------|
| `ipfs-http-client` | Cliente HTTP para nodos IPFS | ~500KB |
| `web3.storage` | Cliente para Web3.Storage | ~50KB |
| `@pinata/sdk` | SDK de Pinata | ~100KB |

---

### 3. CAMBIOS EN EL SMART CONTRACT

#### Opción A: **Agregar CID al struct existente** (Recomendado)

```solidity
// DocumentRegistry.sol
struct Document {
    bytes32 hash;           // Hash keccak256 original (para verificación)
    uint256 timestamp;      // Timestamp
    address signer;         // Firmante
    bytes signature;        // Firma
    string ipfsCID;         // NUEVO: CID de IPFS (ej: "Qm...")
}

function storeDocumentHash(
    bytes32 _hash,
    uint256 _timestamp,
    bytes memory _signature,
    address _signer,
    string memory _ipfsCID  // NUEVO parámetro
) external {
    // ... validaciones existentes
    documents[_hash] = Document({
        hash: _hash,
        timestamp: _timestamp,
        signer: _signer,
        signature: _signature,
        ipfsCID: _ipfsCID  // NUEVO
    });
}
```

**Costo de gas adicional:** ~20,000-30,000 gas extra por el string

#### Opción B: **Mapping separado** (Más gas-efficient)

```solidity
mapping(bytes32 => string) public documentIPFSCIDs;

function storeDocumentHash(..., string memory _ipfsCID) external {
    // ... código existente
    documentIPFSCIDs[_hash] = _ipfsCID;
}
```

**Ventaja:** No rompe compatibilidad con struct existente

---

### 4. CAMBIOS EN EL FRONTEND

#### Archivos a modificar:

**A. `dapp/components/FileUploader.tsx`**
```typescript
// NUEVO: Subir a IPFS después de calcular hash
const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile)

    // 1. Calcular hash (como antes)
    const fileHash = await HashUtils.calculateFileHash(selectedFile)

    // 2. NUEVO: Subir a IPFS
    const ipfsCID = await uploadToIPFS(selectedFile)

    // 3. Emitir ambos al padre
    onFileHash?.(fileHash)
    onIPFSCID?.(ipfsCID)  // NUEVO callback
}
```

**B. `dapp/components/DocumentSigner.tsx`**
```typescript
// NUEVO: Recibir CID y enviarlo al contrato
const handleStore = async () => {
    const tx = await storeDocumentHash(
        documentHash,
        timestamp,
        signature,
        account,
        ipfsCID  // NUEVO parámetro
    )
}
```

**C. `dapp/utils/ipfs.ts` (NUEVO archivo)**
```typescript
// Utilidades para IPFS
export async function uploadToIPFS(file: File): Promise<string> {
    // Implementación con Web3.Storage o Pinata
}

export async function getFromIPFS(cid: string): Promise<Blob> {
    // Recuperar archivo desde IPFS
}

export function getIPFSGatewayURL(cid: string): string {
    // Convertir CID a URL pública
    return `https://ipfs.io/ipfs/${cid}`
    // o https://w3s.link/ipfs/${cid}
}
```

**D. `dapp/components/DocumentHistory.tsx`**
```typescript
// NUEVO: Mostrar enlace para descargar desde IPFS
<a href={getIPFSGatewayURL(doc.ipfsCID)} download>
    Download from IPFS
</a>
```

---

### 5. CONFIGURACIÓN NECESARIA

#### Variables de entorno (`.env.local`):

```env
# Existentes
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# NUEVAS para IPFS (choose one provider)
# ⚠️ NEVER commit these tokens to version control

# Option 1: Web3.Storage
NEXT_PUBLIC_WEB3_STORAGE_TOKEN=<your_web3_storage_token>

# Option 2: Pinata
NEXT_PUBLIC_PINATA_API_KEY=<your_pinata_api_key>
NEXT_PUBLIC_PINATA_SECRET_KEY=<your_pinata_secret_key>
```

#### Obtener token de Web3.Storage:
1. Ir a https://web3.storage
2. Sign in con email o GitHub
3. Crear API token (GRATIS, sin límites)
4. Copiar token a `.env.local`

---

### 6. FLUJO COMPLETO PROPUESTO

```
┌──────────────────────────────────────────────────────────────┐
│ 1. USUARIO SUBE ARCHIVO                                       │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. FRONTEND (FileUploader.tsx)                               │
│    - Calcula hash KECCAK256                                  │
│    - Sube archivo a IPFS → obtiene CID                       │
│    - Muestra: "File uploaded to IPFS: Qm..."                 │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. FIRMA (DocumentSigner.tsx)                                │
│    - Usuario firma el hash (como antes)                      │
│    - Timestamp actual                                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. ALMACENAMIENTO EN BLOCKCHAIN                              │
│    - Envía: hash + timestamp + signature + signer + CID     │
│    - Transacción: storeDocumentHash(..., ipfsCID)           │
│    - Evento emitido: DocumentStored                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. DATOS ALMACENADOS                                         │
│                                                               │
│ BLOCKCHAIN:                    IPFS:                         │
│ ┌─────────────────────┐       ┌──────────────────┐          │
│ │ hash: 0xabc...      │       │ CID: Qm...       │          │
│ │ timestamp: 1234567  │       │                  │          │
│ │ signer: 0xf39...    │       │ Archivo completo │          │
│ │ signature: 0x...    │       │ (PDF, IMG, etc.) │          │
│ │ ipfsCID: "Qm..."    │───────│                  │          │
│ └─────────────────────┘       └──────────────────┘          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. RECUPERACIÓN                                              │
│    - Usuario ve CID en DocumentHistory                      │
│    - Click en "Download from IPFS"                          │
│    - Descarga desde: https://ipfs.io/ipfs/{CID}             │
│    - Archivo recuperado ✅                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. COSTOS Y CONSIDERACIONES (Estimados)

### Costos de Gas (Blockchain)

| Operación | Gas Actual | Gas con IPFS CID | Incremento |
|-----------|-----------|------------------|-----------|
| storeDocumentHash | ~150,000 | ~180,000 | +30,000 (+20%) |
| Primera escritura (deployment) | ~2,500,000 | ~2,600,000 | +100,000 |

**Costo adicional por documento:** ~$0.01-0.05 (depende del precio del gas)

### Costos de Almacenamiento IPFS

| Servicio | Almacenamiento | Costo/mes |
|----------|---------------|-----------|
| Web3.Storage | Ilimitado | $0 (GRATIS) |
| Pinata Free | 1 GB | $0 |
| Pinata Pro | 100 GB | $20 |
| Infura | 5 GB | $0 |
| Nodo propio | Depende del disco | Costo de servidor (~$5-50/mes) |

**Recomendación inicial:** Web3.Storage (gratis ilimitado)

### Velocidad de subida

| Tamaño archivo | Tiempo subida a IPFS |
|----------------|---------------------|
| 1 MB | ~2-5 segundos |
| 10 MB | ~10-20 segundos |
| 100 MB | ~1-3 minutos |

---

## 8. VENTAJAS DE AGREGAR IPFS

✅ **Recuperación de archivos**: Usuario puede descargar su archivo en cualquier momento
✅ **Verificación completa**: Puedes verificar que el archivo coincide con el hash
✅ **Descentralización**: No depende de un servidor central
✅ **Inmutabilidad**: El CID garantiza que el archivo no ha cambiado
✅ **Compartir**: Fácil compartir archivos con solo el CID
✅ **Costo bajo**: Con Web3.Storage es GRATIS

---

## 9. DESVENTAJAS Y CONSIDERACIONES

⚠️ **Pinning necesario**: El archivo debe estar "pineado" para persistir
⚠️ **Latencia**: Puede ser más lento que almacenamiento tradicional (S3, etc.)
⚠️ **Privacidad**: Archivos son públicos (cualquiera con el CID puede acceder)
⚠️ **Tamaño**: Archivos muy grandes (>100MB) pueden ser lentos
⚠️ **Dependencia**: Si usas servicio gestionado, dependes de ese proveedor
⚠️ **Gas extra**: ~20% más caro almacenar con CID

---

## 10. ALTERNATIVAS A IPFS

Si IPFS no es ideal, considera:

| Alternativa | Características | Costo |
|-------------|----------------|-------|
| **Arweave** | Pago único, permanencia garantizada | ~$10/GB (una sola vez) |
| **Filecoin** | Blockchain de almacenamiento | Variable, ~$0.02/GB/mes |
| **AWS S3** | Centralizado, rápido | ~$0.023/GB/mes |
| **IPFS + Filecoin** | IPFS con backup en Filecoin | IPFS gratis + Filecoin ~$0.02/GB |

---

## 11. PASOS PARA IMPLEMENTAR (Pendiente)

### Fase 1: Setup (30 minutos)
1. Crear cuenta en Web3.Storage
2. Obtener API token
3. Instalar dependencias npm: `npm install web3.storage`
4. Agregar token a `.env.local`

### Fase 2: Smart Contract (1-2 horas)
1. Agregar campo `string ipfsCID` al struct Document
2. Modificar función `storeDocumentHash()` para aceptar CID
3. Agregar función `getDocumentCID(bytes32 hash)` para retrieval
4. Recompilar: `forge build`
5. Escribir tests para nueva funcionalidad
6. Re-deploy a Anvil local

### Fase 3: Frontend Utils (30 minutos)
1. Crear `dapp/utils/ipfs.ts`
2. Implementar `uploadToIPFS(file)`
3. Implementar `getFromIPFS(cid)`
4. Implementar `getIPFSGatewayURL(cid)`

### Fase 4: Componentes (2-3 horas)
1. Modificar `FileUploader.tsx` para subir a IPFS
2. Agregar loading state durante upload
3. Mostrar CID al usuario
4. Modificar `DocumentSigner.tsx` para pasar CID
5. Modificar `useContract.ts` para incluir CID en transacción
6. Agregar botón de descarga en `DocumentHistory.tsx`

### Fase 5: Testing (1-2 horas)
1. Probar upload de diferentes tipos de archivo
2. Verificar que CID se almacena correctamente
3. Probar descarga desde IPFS gateway
4. Verificar que hash coincide después de descargar

### Fase 6: Deploy y Documentación (30 minutos)
1. Re-deploy contrato a testnet (si aplica)
2. Actualizar README con instrucciones IPFS
3. Agregar sección "Cómo recuperar documentos"

**Tiempo total estimado:** 6-9 horas de desarrollo

---

## 12. CÓDIGO DE EJEMPLO (PREVIEW)

### Ejemplo de upload a Web3.Storage:

```typescript
// dapp/utils/ipfs.ts
import { Web3Storage } from 'web3.storage'

const client = new Web3Storage({
    token: process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN!
})

export async function uploadToIPFS(file: File): Promise<string> {
    try {
        const cid = await client.put([file], {
            name: file.name,
            maxRetries: 3
        })
        return cid
    } catch (error) {
        console.error('IPFS upload failed:', error)
        throw new Error('Failed to upload to IPFS')
    }
}

export function getIPFSGatewayURL(cid: string, filename?: string): string {
    const base = `https://w3s.link/ipfs/${cid}`
    return filename ? `${base}/${filename}` : base
}
```

### Ejemplo de componente modificado:

```typescript
// dapp/components/FileUploader.tsx
const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile)
    setIsUploading(true)  // NUEVO

    try {
        // 1. Calcular hash
        const fileHash = await HashUtils.calculateFileHash(selectedFile)
        setFileHash(fileHash)

        // 2. NUEVO: Subir a IPFS
        const cid = await uploadToIPFS(selectedFile)
        setIPFSCID(cid)  // NUEVO state

        // 3. Notificar al padre
        onFileHash?.(fileHash)
        onIPFSCID?.(cid)  // NUEVO callback

        alert(`File uploaded to IPFS!\nCID: ${cid}`)
    } catch (error) {
        console.error('Upload failed:', error)
        alert('Failed to upload file')
    } finally {
        setIsUploading(false)
    }
}
```

---

## 13. DECISIONES CLAVE A TOMAR

Antes de implementar, decide:

### A. ¿Servicio IPFS o nodo propio?
- **Recomendado:** Web3.Storage (gratis, simple)
- **Avanzado:** Nodo propio (control total, más complejo)

### B. ¿Modificar struct o usar mapping separado?
- **Opción 1:** Agregar `ipfsCID` al struct (más simple, más gas)
- **Opción 2:** Mapping separado `documentIPFSCIDs` (menos gas, más complejo)

### C. ¿Todos los archivos a IPFS o solo algunos?
- **Opción 1:** IPFS obligatorio para todos
- **Opción 2:** IPFS opcional (checkbox en UI)

### D. ¿Privacidad?
- **IPFS público:** Cualquiera con CID puede acceder
- **Alternativa:** Encriptar archivos antes de subir a IPFS

### E. ¿Gateway de IPFS?
- **Opciones:** ipfs.io, w3s.link, cloudflare-ipfs.com, gateway propio
- **Recomendado:** w3s.link (rápido, confiable)

---

## 14. RIESGOS Y MITIGACIONES

| Riesgo | Mitigación |
|--------|-----------|
| **Archivo no pineado → se pierde** | Usar servicio con pinning automático (Web3.Storage) |
| **CID malformado → error** | Validar CID antes de almacenar en contrato |
| **Servicio IPFS caído** | Usar múltiples gateways de respaldo |
| **Archivo muy grande → timeout** | Límite de tamaño (ej: 50MB max) |
| **Privacidad comprometida** | Advertir al usuario que archivos son públicos |
| **Costos inesperados** | Monitorear uso mensual de almacenamiento |

---

## 15. MÉTRICAS DE ÉXITO

Después de implementar, medir:

- ✅ % de archivos exitosamente subidos a IPFS
- ✅ Tiempo promedio de upload
- ✅ % de archivos recuperables después de 30 días
- ✅ Costo de gas promedio por documento
- ✅ Tamaño promedio de archivos
- ✅ Uso de almacenamiento mensual

---

## RESUMEN EJECUTIVO

### ¿Qué se necesita?

**Infraestructura:**
- Cuenta en Web3.Storage (gratis, 5 minutos)
- Token de API

**Dependencias:**
- `npm install web3.storage` (~50KB)

**Cambios de código:**
- Smart contract: +5 líneas
- Frontend: +100 líneas aprox
- Nuevo archivo utils: `ipfs.ts`

**Costo:**
- IPFS: $0 (gratis con Web3.Storage)
- Gas extra: ~+20% por transacción

**Tiempo de desarrollo:**
- 6-9 horas

**Beneficio:**
- Usuario puede recuperar archivos en cualquier momento
- Sistema verdaderamente descentralizado
- Verificación completa de integridad

---

## PRÓXIMOS PASOS RECOMENDADOS

### Para Nuevas Implementaciones

1. **Crear cuenta en Pinata** (5 min) - https://pinata.cloud
2. **Obtener JWT Token** desde el dashboard
3. **Instalar SDK:** `npm install pinata`
4. **Seguir las fases 1-6** documentadas arriba
5. **Usar el código de este proyecto como referencia**

### Para Este Proyecto (Completado)

1. ✅ **Fases 1-4:** Completadas exitosamente
2. 🔄 **Fase 5:** Testing en progreso - funcionalidad básica verificada
3. ⏳ **Fase 6:** Documentación pendiente

---

## 🔧 ISSUES TÉCNICOS ENCONTRADOS Y SOLUCIONES

Esta sección documenta los problemas encontrados durante la implementación y sus soluciones.

### Issue #1: API Incorrecta del Pinata SDK

**Problema:**
```typescript
// ❌ Código original (incorrecto)
const upload = await pinata.upload.file(file)
```

**Error:**
```
Upload failed: t.upload.file is not a function
```

**Causa:**
El Pinata SDK v2.5.2 no tiene el método `upload.file()` directamente. La API correcta requiere especificar el nivel de acceso.

**Solución:**
```typescript
// ✅ Código corregido
const upload = await pinata.upload.public.file(file)
```

**Archivos afectados:**
- `dapp/utils/ipfs.ts` (línea 148)

**Referencia:**
- [Pinata SDK GitHub](https://github.com/PinataCloud/pinata)
- [Pinata npm package](https://www.npmjs.com/package/pinata)

---

### Issue #2: Propiedad de Respuesta Incorrecta

**Problema:**
```typescript
// ❌ Código original (incorrecto)
if (!upload || !upload.IpfsHash) {
  throw new Error('No CID returned')
}
return { cid: upload.IpfsHash }
```

**Error:**
El CID retornado era `undefined` porque la propiedad no existe.

**Causa:**
El nuevo Pinata SDK (v2) cambió la estructura de respuesta. Ahora usa `cid` en lugar de `IpfsHash`.

**Estructura de respuesta del SDK:**
```typescript
{
  id: string;
  user_id: string;
  name: string;
  cid: string;              // ← Propiedad correcta
  size: number;
  created_at: string;
  mime_type: string;
  // ... otros campos
}
```

**Solución:**
```typescript
// ✅ Código corregido
if (!upload || !upload.cid) {
  throw new IPFSError(
    IPFSErrorType.UPLOAD_FAILED,
    'Upload succeeded but no CID was returned from Pinata.'
  )
}

return {
  cid: upload.cid,                           // ← Usar 'cid'
  size: upload.size || file.size,            // ← Usar 'size' del SDK
  timestamp: new Date(upload.created_at || Date.now()),
}
```

**Archivos afectados:**
- `dapp/utils/ipfs.ts` (líneas 151-162)

---

### Issue #3: Botón de Descarga Genera Archivos `.bin`

**Problema:**
El botón "Download File" descargaba archivos con extensión `.bin` (binario genérico) en lugar del tipo correcto (.pdf, .jpg, etc.).

**Código problemático:**
```typescript
link.download = `document-${documentHash.substring(0, 10)}.bin`  // ❌ Hardcoded .bin
```

**Solución Implementada:**
Eliminamos el botón "Download File" y mantuvimos solo "View on IPFS" porque:
1. El gateway de Pinata maneja correctamente nombres de archivo y extensiones
2. Simplifica la UI
3. El usuario puede descargar desde el gateway con el nombre correcto

**Archivos afectados:**
- `dapp/components/DocumentHistory.tsx`
  - Eliminada función `handleDownloadFromIPFS()` (líneas ~173-199)
  - Eliminado import `Download` icon (revertido después para Export CSV)
  - Eliminado estado `downloadingCID`
  - Simplificada UI de IPFS Storage

**Alternativa no implementada:**
Si se quisiera mantener descarga directa, se debería:
```typescript
// Detectar MIME type del blob
const blob = await downloadFromIPFS(cid)
const mimeType = blob.type
const extension = getExtensionFromMime(mimeType) // función helper
link.download = `document-${hash.substring(0, 10)}.${extension}`
```

---

### Issue #4: Convenciones de Naming (Solidity)

**Problema:**
Foundry linter advertía sobre naming conventions:
```
note[mixed-case-variable]: mutable variables should use mixedCase
  --> src/DocumentRegistry.sol:15:16
   |
15 |         string ipfsCID;  // ← Advertencia
```

**Causa:**
Solidity estándar requiere `mixedCase` para variables (primera letra minúscula en cada palabra excepto la primera).

**Solución:**
Renombramos todas las ocurrencias:
- `ipfsCID` → `ipfsCid`
- `getDocumentCID()` → `getDocumentCid()`
- Variables en tests también actualizadas

**Archivos afectados:**
- `sc/src/DocumentRegistry.sol`
- `sc/test/DocumentRegistry.t.sol`
- `dapp/utils/ipfs.ts`
- `dapp/components/*.tsx` (todos los componentes que usaban CID)

---

### Issue #5: Import Faltante Después de Limpieza

**Problema:**
```
ReferenceError: Download is not defined
```

**Causa:**
Al eliminar el botón "Download File", también eliminamos el import del ícono `Download`, pero este se seguía usando en el botón "Export CSV".

**Solución:**
```typescript
// Restaurar import necesario
import { Download, ... } from 'lucide-react'  // ← Mantener para Export CSV
```

**Lección aprendida:**
Verificar todas las referencias antes de eliminar imports.

---

## 📊 ESTADÍSTICAS DE GAS

### Comparación Antes vs Después de IPFS

| Función | Gas sin IPFS | Gas con CID vacío | Gas con CID corto | Gas con CID largo | Incremento |
|---------|-------------|-------------------|-------------------|-------------------|------------|
| `storeDocumentHash` | ~158,500 | ~190,500 | ~229,000 | ~252,000 | +32k - 93k |
| `getDocumentCid` | N/A | ~2,700 | ~9,900 | ~9,900 | Nueva función |
| `getDocumentInfo` | ~2,700 | ~10,900 | ~12,700 | ~17,300 | +8k - 14k |

**Notas:**
- CID vacío (`""`): +32,000 gas (~20%)
- CID v0 corto (46 chars): +70,500 gas (~44%)
- CID v1 largo (59 chars): +93,500 gas (~59%)

**Recomendación:** El incremento de gas es aceptable considerando la funcionalidad añadida (recuperación de archivos).

---

## ✅ FUNCIONALIDADES VERIFICADAS

### Flujo Completo End-to-End

1. ✅ **Upload de Archivo:**
   - Usuario selecciona archivo
   - Hash KECCAK256 calculado
   - Archivo subido a Pinata IPFS
   - CID mostrado en UI con botón de copiar

2. ✅ **Firma y Almacenamiento:**
   - Usuario firma el documento hash
   - Transacción incluye los 5 parámetros (hash, timestamp, signature, signer, **ipfsCid**)
   - Confirmación en blockchain exitosa
   - Evento `DocumentStored` emitido

3. ✅ **Visualización en History:**
   - Documento aparece en lista con todos sus datos
   - IPFS CID visible y copiable
   - Botón "View on IPFS" funcional

4. ✅ **Recuperación desde IPFS:**
   - Click en "View on IPFS" abre gateway de Pinata
   - Archivo descarga con nombre y extensión correcta
   - Contenido verificado idéntico al original

5. ✅ **Export CSV:**
   - CSV incluye columna "IPFS CID"
   - Todos los datos exportados correctamente

---

## 🎓 LECCIONES APRENDIDAS

1. **Verificar documentación actual:** Web3.Storage cambió a Storacha, requirió cambio a Pinata
2. **Probar APIs antes de implementar:** La API del SDK cambió entre versiones
3. **Naming conventions importan:** Seguir estándares (mixedCase en Solidity)
4. **UI/UX simple es mejor:** Un botón claro es mejor que dos confusos
5. **Gas costs son predecibles:** String storage cuesta ~500-700 gas por byte
6. **Testing manual es crucial:** Los errores de runtime solo se ven en el navegador

---

## 🚀 DEPLOYMENT CHECKLIST

Para deployar a producción (Sepolia/Mainnet):

- [ ] Recompilar contrato: `cd sc && forge build`
- [ ] Ejecutar tests: `forge test`
- [ ] Verificar coverage: `forge coverage --ir-minimum`
- [ ] Deploy a testnet: `forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify`
- [ ] Actualizar `NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS` en `dapp/.env.local`
- [ ] Verificar Pinata JWT en producción
- [ ] Build frontend: `cd dapp && npm run build`
- [ ] Probar en testnet antes de mainnet
- [ ] Documentar dirección del contrato deployado
- [ ] Actualizar README con instrucciones de uso

---

## 📞 SOPORTE Y REFERENCIAS

**Pinata:**
- Dashboard: https://app.pinata.cloud
- Docs: https://docs.pinata.cloud
- Gateway: https://gateway.pinata.cloud/ipfs/{CID}

**Recursos del Proyecto:**
- Smart Contract: `sc/src/DocumentRegistry.sol`
- Tests: `sc/test/DocumentRegistry.t.sol`
- IPFS Utils: `dapp/utils/ipfs.ts`
- Componentes principales: `dapp/components/`

**Comandos Útiles:**
```bash
# Smart Contract
cd sc
forge build
forge test -vv
forge coverage --ir-minimum

# Frontend
cd dapp
npm run dev
npm run build
npm run lint
```

---

**FIN DEL DOCUMENTO - Última actualización: 2025-12-28 18:30**
