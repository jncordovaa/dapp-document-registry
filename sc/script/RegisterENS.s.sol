// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RegisterENS - Script Multi-Red de Registro de Nombres ENS
 * @author Curso Solidity
 * @notice Este script automatiza el proceso completo de registro de un nombre ENS
 * @notice Soporta tanto Sepolia Testnet como Ethereum Mainnet
 *
 * @dev FLUJO DEL PROCESO DE REGISTRO ENS (2 PASOS OBLIGATORIOS):
 *
 *      ┌─────────────────────────────────────────────────────────────────────┐
 *      │  PASO 1: COMMITMENT (Compromiso)                                     │
 *      │  - Función: run()                                                     │
 *      │  - Propósito: Prevenir front-running attacks                         │
 *      │  - Acción: Envía un hash del nombre + parámetros al contrato         │
 *      │  - Tiempo de espera: Mínimo 60 segundos antes del Paso 2             │
 *      └─────────────────────────────────────────────────────────────────────┘
 *                                    ↓
 *                            [ESPERAR 60 SEGUNDOS]
 *                                    ↓
 *      ┌─────────────────────────────────────────────────────────────────────┐
 *      │  PASO 2: REGISTRATION (Registro)                                     │
 *      │  - Función: completeRegistration()                                   │
 *      │  - Propósito: Completar el registro del nombre                       │
 *      │  - Acción: Envía los parámetros originales + pago en ETH             │
 *      │  - Resultado: Nombre ENS registrado y resolver configurado           │
 *      └─────────────────────────────────────────────────────────────────────┘
 *                                    ↓
 *      ┌─────────────────────────────────────────────────────────────────────┐
 *      │  PASO 3: VERIFICACIÓN (Opcional)                                     │
 *      │  - Función: verifyRegistration()                                     │
 *      │  - Propósito: Confirmar que el nombre resuelve correctamente         │
 *      │  - Acción: Consulta el resolver para verificar la dirección          │
 *      └─────────────────────────────────────────────────────────────────────┘
 *
 * @dev CONCEPTOS CLAVE DE ENS:
 *
 *      - NAMEHASH: Sistema jerárquico de identificación de nombres ENS
 *        Ejemplo: "alice.eth" -> keccak256(keccak256("eth") + keccak256("alice"))
 *
 *      - COMMITMENT: Hash de los parámetros de registro que se envía primero
 *        Previene que otros vean tu transacción en el mempool y registren el nombre antes
 *
 *      - RESOLVER: Contrato que traduce nombres ENS a direcciones Ethereum
 *        Es como un "diccionario" que mapea alice.eth -> 0x1234...
 *
 *      - REVERSE RECORD: Permite que una dirección apunte de vuelta a un nombre ENS
 *        Ejemplo: 0x1234... -> alice.eth (útil para mostrar nombres en dApps)
 *
 * @dev REDES SOPORTADAS:
 *
 *      SEPOLIA TESTNET (Chain ID: 11155111)
 *      - ETH Registrar Controller: 0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72
 *      - Public Resolver: 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD
 *      - Uso: Para pruebas con ETH testnet (sin valor real)
 *
 *      ETHEREUM MAINNET (Chain ID: 1)
 *      - ETH Registrar Controller: 0x253553366Da8546fC250F225fe3d25d0C782303b
 *      - Public Resolver: 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63
 *      - ADVERTENCIA: Requiere ETH real. Los nombres cuestan dinero real.
 *
 * @dev DETECCIÓN AUTOMÁTICA DE RED:
 *      El script detecta automáticamente la red usando block.chainid
 *      y selecciona las direcciones correctas de los contratos ENS.
 *
 * @dev COMANDOS DE USO:
 *
 *      # 1. Configurar variables de entorno en .env
 *      ENS_NAME=alice
 *      MNEMONIC="your twelve word mnemonic phrase here"
 *      # O alternativamente:
 *      # PRIVATE_KEY=0x...
 *
 *      # 2. Ejecutar Paso 1 (Commitment) - SEPOLIA TESTNET
 *      forge script script/RegisterENS.s.sol:RegisterENS --rpc-url sepolia --broadcast
 *
 *      # 2b. Ejecutar Paso 1 (Commitment) - ETHEREUM MAINNET
 *      # ADVERTENCIA: Esto usará ETH real
 *      forge script script/RegisterENS.s.sol:RegisterENS --rpc-url mainnet --broadcast
 *
 *      # 3. ESPERAR 60 SEGUNDOS MÍNIMO
 *
 *      # 4. Ejecutar Paso 2 (Registration) - SEPOLIA
 *      forge script script/RegisterENS.s.sol:RegisterENS --sig 'completeRegistration()' --rpc-url sepolia --broadcast
 *
 *      # 4b. Ejecutar Paso 2 (Registration) - MAINNET
 *      # ADVERTENCIA: Esto gastará ETH real
 *      forge script script/RegisterENS.s.sol:RegisterENS --sig 'completeRegistration()' --rpc-url mainnet --broadcast
 *
 *      # 5. Verificar registro (Opcional)
 *      forge script script/RegisterENS.s.sol:RegisterENS --sig 'verifyRegistration()' --rpc-url sepolia
 *      # O para mainnet:
 *      forge script script/RegisterENS.s.sol:RegisterENS --sig 'verifyRegistration()' --rpc-url mainnet
 *
 * @dev REFERENCIAS ÚTILES:
 *      - Documentación ENS: https://docs.ens.domains/
 *      - Sepolia ENS App: https://app.ens.domains/
 *      - Namehash Calculator: https://swolfeyes.github.io/ethereum-namehash-calculator/
 */

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

/**
 * @dev Interfaces mínimas para interactuar con ENS en Sepolia
 *
 * ENS está compuesto por varios contratos:
 * - ETHRegistrarController: Maneja el registro de nombres .eth
 * - PublicResolver: Resuelve nombres a direcciones y viceversa
 * - Registry: Almacena la propiedad de los nombres (no usado directamente aquí)
 */
/**
 * @title IETHRegistrarController
 * @notice Interfaz del controlador de registro de nombres .eth en ENS
 * @dev Este contrato maneja el proceso de registro de 2 pasos (commitment + register)
 *      Dirección en Sepolia: 0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72
 */
interface IETHRegistrarController {
    /**
     * @dev Estructura para almacenar commitments (no se usa directamente en este script)
     */
    struct CommitmentWithConfig {
        bytes32 commitment;
    }

    /**
     * @notice Genera un hash de commitment a partir de los parámetros de registro
     * @dev Este hash se usa en el Paso 1 para "reservar" el nombre sin revelarlo completamente
     *
     * @param name Nombre ENS sin el sufijo .eth (ej: "alice" para alice.eth)
     * @param owner Dirección que será dueña del nombre ENS
     * @param duration Duración del registro en segundos (ej: 365 days = 31536000)
     * @param secret Salt aleatorio para hacer el commitment único y privado
     * @param resolver Dirección del contrato resolver que resolverá el nombre
     * @param data Datos codificados para configurar el resolver (ej: setAddr)
     * @param reverseRecord Si true, configura el reverse record (address -> nombre)
     * @param ownerControlledFuses Configuración de permisos avanzados (0 = permisos normales)
     *
     * @return bytes32 Hash del commitment que se enviará en commit()
     *
     * @dev Ejemplo de uso:
     *      bytes32 commitment = controller.makeCommitment(
     *          "alice",
     *          0x1234...,
     *          365 days,
     *          keccak256("my-secret"),
     *          resolverAddress,
     *          data,
     *          true,
     *          0
     *      );
     */
    function makeCommitment(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] calldata data,
        bool reverseRecord,
        uint16 ownerControlledFuses
    ) external pure returns (bytes32);

    /**
     * @notice Envía el commitment al contrato (PASO 1)
     * @dev Después de llamar esta función, debes esperar mínimo 60 segundos
     *      antes de llamar register(). Esto previene front-running.
     *
     * @param commitment Hash generado por makeCommitment()
     *
     * @dev ¿Por qué existe este paso?
     *      Sin el commitment, un atacante podría ver tu transacción de registro
     *      en el mempool y enviar la misma transacción con más gas para
     *      registrar el nombre antes que tú (front-running attack).
     *
     *      Con el commitment:
     *      1. Envías el hash (nadie sabe qué nombre quieres)
     *      2. Esperas 60 segundos (tiempo mínimo de espera)
     *      3. Envías el registro real (ya es tarde para front-run)
     */
    function commit(bytes32 commitment) external;

    /**
     * @notice Completa el registro del nombre ENS (PASO 2)
     * @dev Esta función debe llamarse DESPUÉS de commit() y DESPUÉS de esperar 60 segundos
     *      Los parámetros deben ser EXACTAMENTE los mismos que se usaron en makeCommitment()
     *
     * @param name Nombre ENS sin .eth (debe coincidir con el commitment)
     * @param owner Dirección dueña (debe coincidir con el commitment)
     * @param duration Duración en segundos (debe coincidir con el commitment)
     * @param secret Salt secreto (debe coincidir con el commitment)
     * @param resolver Dirección del resolver (debe coincidir con el commitment)
     * @param data Datos para configurar resolver (debe coincidir con el commitment)
     * @param reverseRecord Configurar reverse record (debe coincidir con el commitment)
     * @param ownerControlledFuses Permisos avanzados (debe coincidir con el commitment)
     *
     * @dev La función es payable porque requiere pago en ETH
     *      El precio se calcula con rentPrice() y se recomienda enviar 10% extra
     *      para evitar que falle si el precio sube ligeramente
     *
     * @dev Ejemplo de uso:
     *      uint256 price = controller.rentPrice("alice", 365 days);
     *      controller.register{value: price * 110 / 100}(
     *          "alice", owner, 365 days, secret, resolver, data, true, 0
     *      );
     */
    function register(
        string calldata name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] calldata data,
        bool reverseRecord,
        uint16 ownerControlledFuses
    ) external payable;

    /**
     * @notice Calcula el precio de registro de un nombre ENS
     * @dev El precio depende de:
     *      - Longitud del nombre (nombres más cortos son más caros)
     *      - Duración del registro (más tiempo = más caro)
     *
     * @param name Nombre ENS sin .eth (ej: "alice")
     * @param duration Duración del registro en segundos (ej: 365 days)
     *
     * @return uint256 Precio en wei (1 ETH = 10^18 wei)
     *
     * @dev Precios aproximados en Sepolia (testnet):
     *      - Nombres 3 caracteres: ~$640/año (más caros)
     *      - Nombres 4 caracteres: ~$160/año
     *      - Nombres 5+ caracteres: ~$5/año (más baratos)
     *
     * @dev IMPORTANTE: El precio puede cambiar entre commit() y register()
     *      Por eso se recomienda enviar 10% extra al llamar register()
     */
    function rentPrice(string memory name, uint256 duration) external view returns (uint256);
}

/**
 * @title IPublicResolver
 * @notice Interfaz del resolver público de ENS
 * @dev El resolver es el "traductor" entre nombres ENS y direcciones Ethereum
 *      Dirección en Sepolia: 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD
 *
 *      Piensa en el resolver como una agenda telefónica:
 *      - Nombre: "alice.eth" -> Teléfono: 0x1234...
 */
interface IPublicResolver {
    /**
     * @notice Configura la dirección Ethereum asociada a un nombre ENS
     * @dev Esta función se llama automáticamente durante el registro
     *      cuando pasamos 'data' con setAddr codificado
     *
     * @param node Namehash del nombre ENS (ej: namehash("alice.eth"))
     * @param addr Dirección Ethereum que resolverá el nombre
     *
     * @dev Ejemplo:
     *      Si node = namehash("alice.eth") y addr = 0x1234...
     *      Entonces alice.eth -> 0x1234...
     *
     * @dev IMPORTANTE: Solo el dueño del nombre puede llamar esta función
     */
    function setAddr(bytes32 node, address addr) external;

    /**
     * @notice Consulta qué dirección Ethereum resuelve un nombre ENS
     * @dev Esta es una función view (solo lectura) que no cuesta gas
     *
     * @param node Namehash del nombre ENS a consultar
     * @return address Dirección Ethereum asociada al nombre
     *
     * @dev Retorna address(0) si:
     *      - El nombre no está registrado
     *      - El nombre no tiene resolver configurado
     *      - El resolver no tiene dirección configurada para ese nombre
     *
     * @dev Ejemplo de uso:
     *      bytes32 node = namehash("alice.eth");
     *      address owner = resolver.addr(node);
     *      // owner = 0x1234... (si está configurado)
     *      // owner = 0x0000... (si no está configurado)
     */
    function addr(bytes32 node) external view returns (address);
}

/**
 * @title RegisterENS
 * @notice Contrato script multi-red para registrar nombres ENS
 * @dev Extiende de Script (Foundry) para poder ejecutar como script de deploy/interacción
 * @dev Detecta automáticamente la red y usa las direcciones de contratos correctas
 */
contract RegisterENS is Script {
    /**
     * @dev Estructura para almacenar la configuración de red
     *
     * @param name Nombre legible de la red (ej: "Sepolia Testnet")
     * @param chainId ID de la cadena (ej: 11155111 para Sepolia, 1 para Mainnet)
     * @param registrarController Dirección del ETHRegistrarController en esta red
     * @param publicResolver Dirección del PublicResolver en esta red
     */
    struct NetworkConfig {
        string name;
        uint256 chainId;
        address registrarController;
        address publicResolver;
    }

    /**
     * @notice Obtiene la configuración de red según el chain ID actual
     * @dev Detecta automáticamente la red usando block.chainid
     *
     * @return config Configuración de la red actual con direcciones de contratos ENS
     *
     * @dev SEPOLIA TESTNET (Chain ID: 11155111)
     *      - Red de pruebas oficial de Ethereum
     *      - ETH sin valor real (se obtiene gratis en faucets)
     *      - Ideal para probar antes de desplegar en mainnet
     *      - ETH Registrar Controller: 0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72
     *      - Public Resolver: 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD
     *
     * @dev ETHEREUM MAINNET (Chain ID: 1)
     *      - Red principal de Ethereum en producción
     *      - ETH tiene valor monetario real
     *      - Los nombres ENS cuestan dinero real
     *      - Precios aproximados (2024):
     *        * Nombres 3 caracteres: ~$640/año
     *        * Nombres 4 caracteres: ~$160/año
     *        * Nombres 5+ caracteres: ~$5/año
     *      - ETH Registrar Controller: 0x253553366Da8546fC250F225fe3d25d0C782303b
     *      - Public Resolver: 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63
     *
     * @dev ¿POR QUÉ LAS DIRECCIONES SON DIFERENTES ENTRE REDES?
     *      - Cada red es una blockchain independiente con su propio estado
     *      - Los contratos se despliegan en diferentes direcciones en cada red
     *      - Los contratos tienen la misma lógica pero instancias separadas
     *      - Esto permite probar en Sepolia sin afectar Mainnet
     *
     * @dev SEGURIDAD:
     *      - La función revierte si detecta una red no soportada
     *      - Esto previene enviar transacciones a redes incorrectas
     *      - Protege contra usar direcciones equivocadas
     */
    function getNetworkConfig() internal view returns (NetworkConfig memory) {
        uint256 chainId = block.chainid;

        if (chainId == 11155111) {
            // SEPOLIA TESTNET
            return NetworkConfig({
                name: "Sepolia Testnet",
                chainId: 11155111,
                registrarController: 0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72,
                publicResolver: 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD
            });
        } else if (chainId == 1) {
            // ETHEREUM MAINNET
            return NetworkConfig({
                name: "Ethereum Mainnet",
                chainId: 1,
                registrarController: 0x253553366Da8546fC250F225fe3d25d0C782303b,
                publicResolver: 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63
            });
        } else {
            // RED NO SOPORTADA
            revert(
                string.concat(
                    "Unsupported network with chainId: ",
                    vm.toString(chainId),
                    ". Supported networks: Sepolia (11155111), Mainnet (1)"
                )
            );
        }
    }

    /**
     * @notice PASO 1: Envía el commitment para reservar el nombre ENS
     * @dev Esta es la función principal que se ejecuta con: forge script script/RegisterENS.s.sol
     *
     * @dev FLUJO DE EJECUCIÓN:
     *      1. Lee ENS_NAME desde variables de entorno (.env)
     *      2. Obtiene la private key/mnemonic del deployer
     *      3. Calcula el namehash del nombre (alice -> alice.eth)
     *      4. Genera el commitment hash
     *      5. Envía el commitment al ETHRegistrarController
     *      6. Muestra instrucciones para continuar con el Paso 2
     *
     * @dev VARIABLES DE ENTORNO REQUERIDAS:
     *      - ENS_NAME: Nombre sin .eth (ej: "alice")
     *      - MNEMONIC o PRIVATE_KEY: Credenciales del owner
     *      - MNEMONIC_INDEX (opcional): Índice de cuenta (default: 0)
     *
     * @dev IMPORTANTE:
     *      Después de ejecutar esta función, DEBES esperar mínimo 60 segundos
     *      antes de ejecutar completeRegistration()
     *
     * @dev EJEMPLO DE USO:
     *      # En .env
     *      ENS_NAME=alice
     *      MNEMONIC="your twelve word phrase..."
     *
     *      # Ejecutar script
     *      forge script script/RegisterENS.s.sol:RegisterENS --rpc-url sepolia --broadcast
     */
    function run() external {
        // ============================================
        // 1. DETECTAR RED Y CARGAR CONFIGURACIÓN DE CONTRATOS ENS
        // ============================================

        /**
         * @dev Obtener configuración de red automáticamente
         *
         * Esta función detecta el chain ID de la red actual y retorna
         * las direcciones correctas de los contratos ENS para esa red.
         *
         * Revierte si la red no es soportada (ni Sepolia ni Mainnet)
         */
        NetworkConfig memory config = getNetworkConfig();

        console.log("=== NETWORK DETECTION ===");
        console.log("Network:", config.name);
        console.log("Chain ID:", config.chainId);
        console.log("ETH Registrar Controller:", config.registrarController);
        console.log("Public Resolver:", config.publicResolver);

        /**
         * @dev ADVERTENCIA DE SEGURIDAD PARA MAINNET
         *
         * Si detectamos que estamos en mainnet (Chain ID 1), mostramos
         * advertencias claras porque:
         * - Se gastará ETH real
         * - Los nombres cuestan dinero real
         * - Las transacciones son irreversibles
         */
        if (config.chainId == 1) {
            console.log("\n");
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.log("!!!  WARNING: YOU ARE ON ETHEREUM MAINNET   !!!");
            console.log("!!!  THIS WILL SPEND REAL ETH                !!!");
            console.log("!!!  ENS NAMES COST REAL MONEY               !!!");
            console.log("!!!  MAKE SURE YOU UNDERSTAND WHAT YOU DO   !!!");
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.log("\n");
        }

        // ============================================
        // 2. CARGAR CONFIGURACIÓN DESDE VARIABLES DE ENTORNO
        // ============================================

        // Lee el nombre ENS desde .env (sin incluir .eth)
        // Ejemplo: ENS_NAME=alice registrará alice.eth
        string memory ensName = vm.envString("ENS_NAME");

        // Variables para almacenar credenciales del usuario
        uint256 deployerPrivateKey; // Private key que firmará las transacciones
        address owner;              // Dirección pública derivada de la private key

        /**
         * @dev Foundry permite dos formas de configurar credenciales:
         *
         * OPCIÓN 1 - MNEMONIC (Recomendado para múltiples cuentas):
         *   MNEMONIC="word1 word2 ... word12"
         *   MNEMONIC_INDEX=0  (opcional, default: 0)
         *
         * OPCIÓN 2 - PRIVATE_KEY (Más simple):
         *   PRIVATE_KEY=0xabc123...
         *
         * El script intenta primero con MNEMONIC, si falla usa PRIVATE_KEY
         */
        try vm.envString("MNEMONIC") returns (string memory mnemonic) {
            // Opción 1: Derivar cuenta desde mnemonic (seed phrase)
            // vm.envOr: Si MNEMONIC_INDEX no existe, usa 0 por defecto
            uint32 index = uint32(vm.envOr("MNEMONIC_INDEX", uint256(0)));

            // vm.deriveKey: Deriva la private key desde el mnemonic usando BIP-39/BIP-44
            // index=0 -> primera cuenta (m/44'/60'/0'/0/0)
            // index=1 -> segunda cuenta (m/44'/60'/0'/0/1), etc.
            deployerPrivateKey = vm.deriveKey(mnemonic, index);

            // vm.addr: Convierte private key a dirección pública Ethereum
            owner = vm.addr(deployerPrivateKey);

            console.log("Using mnemonic (account index:", index, ")");
        } catch {
            // Opción 2: Usar directamente una private key desde .env
            // Esta opción se ejecuta si MNEMONIC no existe en .env
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
            owner = vm.addr(deployerPrivateKey);
            console.log("Using private key");
        }

        // ============================================
        // 2. INICIAR TRANSACCIONES EN BLOCKCHAIN
        // ============================================

        // vm.startBroadcast: A partir de aquí, todas las transacciones se enviarán
        // a la blockchain real firmadas con deployerPrivateKey
        vm.startBroadcast(deployerPrivateKey);

        console.log("\n=== REGISTRATION PARAMETERS ===");
        console.log("Owner address:", owner);
        console.log("ENS Name:", ensName);

        // ============================================
        // 3. PREPARAR PARÁMETROS DEL COMMITMENT
        // ============================================

        /**
         * @dev SECRET: Salt aleatorio para hacer el commitment único y seguro
         *
         * 🔒 CONCEPTO DE SEGURIDAD: ¿Por qué necesitamos un secret?
         *
         * ❌ SIN SECRET (O CON SECRET PREDECIBLE):
         *    VULNERABILIDAD (Front-Running Attack):
         *    1. Envías tu commitment a la blockchain
         *    2. Un atacante ve tu transacción en el mempool
         *    3. El atacante prueba nombres comunes con secrets conocidos
         *    4. Cuando encuentra coincidencia, descubre qué nombre quieres
         *    5. El atacante registra ese nombre antes que tú con más gas
         *
         * ✅ CON SECRET ÚNICO Y PRIVADO:
         *    PROTECCIÓN:
         *    - El atacante no puede adivinar tu secret
         *    - No puede hacer front-running
         *    - Tu nombre permanece privado hasta que completes el registro
         *
         * 📝 CONFIGURACIÓN:
         *    El secret se lee desde .env:
         *    ENS_SECRET=mi-salt-super-secreto-unico-12345
         *
         *    IMPORTANTE: Usa un string único y difícil de adivinar
         *    Ejemplos:
         *    - ✅ BUENO: "my-random-salt-xyz-789-abc-2024"
         *    - ❌ MALO: "123" o "secret" (muy predecibles)
         *
         * ⚠️  ADVERTENCIAS DE SEGURIDAD:
         *    - NO uses secrets simples como "123" o "password"
         *    - NO compartas tu .env con nadie
         *    - El archivo .env debe estar en .gitignore
         *    - Usa el MISMO secret en ambos pasos (commitment y registro)
         *
         * 🔐 IMPORTANTE:
         *    Debes usar el MISMO ENS_SECRET en run() y completeRegistration()
         *    Si cambias el secret entre pasos, el registro fallará
         */
        string memory secretString = vm.envString("ENS_SECRET");
        bytes32 secret = keccak256(abi.encodePacked(secretString));

        console.log("\n=== SECRET LOADED ===");
        console.log("Secret loaded from .env (ENS_SECRET)");
        console.logBytes32(secret);
        console.log("WARNING: Use the SAME ENS_SECRET value in completeRegistration()");

        /**
         * @dev DURATION: Duración del registro en segundos
         *
         * Solidity tiene unidades de tiempo convenientes:
         * - 1 minutes = 60
         * - 1 hours = 3600
         * - 1 days = 86400
         * - 365 days = 31536000
         *
         * Aquí registramos por 1 año (365 días)
         */
        uint256 duration = 365 days;

        // ============================================
        // 4. CALCULAR NAMEHASH DEL NOMBRE ENS
        // ============================================

        /**
         * @dev NAMEHASH: Sistema jerárquico de identificación de nombres ENS
         *
         * Algoritmo:
         * 1. namehash("") = 0x0000...0000
         * 2. namehash("eth") = keccak256(namehash("") + keccak256("eth"))
         * 3. namehash("alice.eth") = keccak256(namehash("eth") + keccak256("alice"))
         *
         * ethNode es el hash precalculado de "eth" (el dominio raíz)
         * Este valor es una constante conocida en toda la infraestructura ENS
         */
        bytes32 ethNode = 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae;

        /**
         * @dev labelHash: Hash del nombre específico (sin .eth)
         * Ejemplo: si ensName = "alice"
         * labelHash = keccak256("alice")
         */
        bytes32 labelHash = keccak256(abi.encodePacked(ensName));

        /**
         * @dev namehash: Identificador único del nombre completo alice.eth
         *
         * Cálculo: keccak256(ethNode + labelHash)
         *        = keccak256(namehash("eth") + keccak256("alice"))
         *        = namehash("alice.eth")
         *
         * Este namehash se usa para:
         * - Identificar el nombre en el resolver
         * - Configurar la dirección asociada (setAddr)
         * - Consultar la resolución del nombre (addr)
         */
        bytes32 namehash = keccak256(abi.encodePacked(ethNode, labelHash));

        // ============================================
        // 5. PREPARAR DATA PARA CONFIGURAR EL RESOLVER
        // ============================================

        /**
         * @dev DATA: Instrucciones codificadas para el resolver
         *
         * Durante el registro, podemos enviar "data" que se ejecutará automáticamente
         * para configurar el resolver. Aquí codificamos una llamada a setAddr()
         *
         * abi.encodeWithSignature: Genera calldata para llamar una función
         * - Firma: "setAddr(bytes32,address)"
         * - Parámetros: namehash (identificador), owner (dirección a resolver)
         *
         * Resultado: Cuando se complete el registro, el resolver automáticamente
         *           configurará alice.eth -> dirección del owner
         */
        bytes[] memory data = new bytes[](1);
        data[0] = abi.encodeWithSignature("setAddr(bytes32,address)", namehash, owner);

        // ============================================
        // 6. CREAR EL COMMITMENT HASH
        // ============================================

        /**
         * @dev Obtener interfaz del controlador de registro ENS
         *
         * Usamos la dirección del controlador específica de la red detectada
         * (config.registrarController), no una dirección hardcodeada
         */
        IETHRegistrarController controller = IETHRegistrarController(config.registrarController);

        /**
         * @dev makeCommitment: Genera el hash de commitment
         *
         * Este hash incluye TODOS los parámetros del registro:
         * - ensName: "alice"
         * - owner: 0x1234... (dirección que poseerá el nombre)
         * - duration: 365 days
         * - secret: Salt aleatorio para privacidad
         * - config.publicResolver: Dirección del resolver a usar (específica de la red)
         * - data: Instrucciones para configurar setAddr
         * - reverseRecord: true (configurar 0x1234... -> alice.eth también)
         * - ownerControlledFuses: 0 (sin restricciones de permisos)
         *
         * CRÍTICO: Estos mismos parámetros deben usarse en register()
         */
        bytes32 commitment = controller.makeCommitment(
            ensName,
            owner,
            duration,
            secret,
            config.publicResolver, // Usamos el resolver específico de la red
            data,
            true, // reverseRecord: permite que dApps muestren alice.eth en lugar de 0x1234...
            0     // ownerControlledFuses: 0 = permisos estándar sin restricciones
        );

        console.log("Commitment created:");
        console.logBytes32(commitment);

        // ============================================
        // 7. ENVIAR COMMITMENT A LA BLOCKCHAIN (PASO 1)
        // ============================================

        console.log("\n=== STEP 1: Sending commitment ===");

        /**
         * @dev commit(): Envía el commitment al controlador
         *
         * Esta transacción registra el commitment en blockchain pero NO revela
         * qué nombre quieres registrar. Otros solo ven un hash aleatorio.
         *
         * Después de esta transacción:
         * - DEBES esperar mínimo 60 segundos
         * - LUEGO puedes llamar register() con los mismos parámetros
         * - Si intentas registrar antes de 60 segundos, la transacción fallará
         */
        controller.commit(commitment);
        console.log("Commitment sent! Transaction confirmed.");

        // ============================================
        // 8. CALCULAR PRECIO DEL REGISTRO
        // ============================================

        /**
         * @dev rentPrice(): Calcula el precio actual del registro
         *
         * El precio depende de:
         * - Longitud del nombre (más corto = más caro)
         * - Duración del registro (más tiempo = más caro)
         *
         * NOTA: El precio puede cambiar entre ahora y cuando llames register()
         *       Por eso en completeRegistration() enviamos 10% extra
         */
        uint256 price = controller.rentPrice(ensName, duration);
        console.log("\n=== PRICING INFORMATION ===");
        console.log("Registration price (wei):", price);
        console.log("Registration price (ETH):", price / 1e18);

        /**
         * @dev Mostrar advertencia específica para mainnet sobre el costo
         */
        if (config.chainId == 1) {
            console.log("\nWARNING: This is REAL ETH on MAINNET!");
            console.log("You will pay approximately", price / 1e18, "ETH plus gas fees");
        } else {
            console.log("\nNote: This is testnet ETH (no real value)");
        }

        console.log("\nMin commitment age: 60 seconds (standard ENS requirement)");

        // ============================================
        // 9. FINALIZAR BROADCAST Y MOSTRAR INSTRUCCIONES
        // ============================================

        // vm.stopBroadcast: Detiene el envío de transacciones a blockchain
        vm.stopBroadcast();

        console.log("\n=== IMPORTANT ===");
        console.log("Wait at least 60 seconds (~1 minute) before running the register step.");
        console.log("\nTo complete registration, run:");
        console.log("forge script script/RegisterENS.s.sol:RegisterENS --sig 'completeRegistration()' --rpc-url sepolia --broadcast");
    }

    /**
     * @notice PASO 2: Completa el registro del nombre ENS después del commitment
     * @dev Esta función se ejecuta con: forge script ... --sig 'completeRegistration()'
     *
     * @dev FLUJO DE EJECUCIÓN:
     *      1. Lee las mismas variables de entorno que run()
     *      2. Obtiene las mismas credenciales del usuario
     *      3. Recrea EXACTAMENTE los mismos parámetros (secret, duration, namehash, data)
     *      4. Calcula el precio actual del registro
     *      5. Envía la transacción de registro con pago en ETH
     *      6. ENS automáticamente configura el resolver y reverse record
     *
     * @dev REQUISITOS PREVIOS:
     *      - DEBES haber ejecutado run() primero
     *      - DEBES esperar mínimo 60 segundos después de run()
     *      - Los parámetros DEBEN ser idénticos a los usados en run()
     *      - Tu wallet DEBE tener suficiente ETH en Sepolia
     *
     * @dev PARÁMETROS CRÍTICOS QUE DEBEN COINCIDIR:
     *      - secret: Exactamente el mismo salt
     *      - duration: Misma duración (365 days)
     *      - ensName: Mismo nombre
     *      - owner: Misma dirección
     *      - resolver: Mismo resolver (PUBLIC_RESOLVER)
     *      - data: Misma configuración de setAddr
     *
     * @dev EJEMPLO DE USO:
     *      # Después de esperar 60 segundos desde run()
     *      forge script script/RegisterENS.s.sol:RegisterENS --sig 'completeRegistration()' --rpc-url sepolia --broadcast
     */
    function completeRegistration() external {
        // ============================================
        // 1. DETECTAR RED Y CARGAR CONFIGURACIÓN (IGUAL QUE EN run())
        // ============================================

        /**
         * @dev Obtener configuración de red automáticamente
         *
         * CRÍTICO: Debe ser la MISMA red que en run()
         * Si cambias de red entre run() y completeRegistration(),
         * el commitment no existirá y la transacción fallará
         */
        NetworkConfig memory config = getNetworkConfig();

        console.log("=== NETWORK DETECTION ===");
        console.log("Network:", config.name);
        console.log("Chain ID:", config.chainId);

        /**
         * @dev ADVERTENCIA DE SEGURIDAD PARA MAINNET
         */
        if (config.chainId == 1) {
            console.log("\n");
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.log("!!!  WARNING: YOU ARE ON ETHEREUM MAINNET   !!!");
            console.log("!!!  THIS WILL SPEND REAL ETH NOW           !!!");
            console.log("!!!  TRANSACTION IS IRREVERSIBLE            !!!");
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.log("\n");
        }

        // ============================================
        // 2. CARGAR CONFIGURACIÓN DESDE VARIABLES DE ENTORNO
        // ============================================

        // Lee el mismo nombre ENS desde .env
        string memory ensName = vm.envString("ENS_NAME");

        // Obtiene las mismas credenciales (debe ser el mismo owner)
        uint256 deployerPrivateKey;
        address owner;

        try vm.envString("MNEMONIC") returns (string memory mnemonic) {
            // Opción 1: Usar Mnemonic (mismo índice que en run())
            uint32 index = uint32(vm.envOr("MNEMONIC_INDEX", uint256(0)));
            deployerPrivateKey = vm.deriveKey(mnemonic, index);
            owner = vm.addr(deployerPrivateKey);
        } catch {
            // Opción 2: Usar Private Key (misma key que en run())
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
            owner = vm.addr(deployerPrivateKey);
        }

        // Iniciar transacciones con la misma cuenta
        vm.startBroadcast(deployerPrivateKey);

        console.log("\n=== STEP 2: Completing registration ===");
        console.log("Owner:", owner);
        console.log("ENS Name:", ensName);

        // ============================================
        // 2. CARGAR SECRET DESDE .ENV (IGUAL QUE EN run())
        // ============================================

        /**
         * @dev CARGAR SECRET DESDE .ENV
         *
         * CRÍTICO: Debes usar el MISMO ENS_SECRET que usaste en run()
         *
         * El secret se lee desde el archivo .env:
         * ENS_SECRET=mi-salt-super-secreto-unico-12345
         *
         * ⚠️  IMPORTANTE:
         *    - El ENS_SECRET DEBE ser EXACTAMENTE el mismo que en run()
         *    - Si cambias el secret, el registro fallará
         *    - Si no está definido en .env, el script fallará
         *
         * 🔒 SEGURIDAD:
         *    - El .env debe estar en .gitignore (ya protegido)
         *    - No compartas tu .env con nadie
         *    - Usa un secret difícil de adivinar
         */
        console.log("\n=== LOADING SECRET ===");
        console.log("Loading secret from .env (ENS_SECRET)");

        string memory secretString = vm.envString("ENS_SECRET");
        bytes32 secret = keccak256(abi.encodePacked(secretString));

        console.log("Secret loaded successfully!");
        console.logBytes32(secret);

        // Duration: Misma duración que en run()
        uint256 duration = 365 days;

        // ============================================
        // 3. CALCULAR NAMEHASH (IGUAL QUE EN run())
        // ============================================

        // ethNode: Hash del dominio raíz "eth" (constante)
        bytes32 ethNode = 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae;

        // labelHash: Hash del nombre específico
        bytes32 labelHash = keccak256(abi.encodePacked(ensName));

        // namehash: Identificador completo de alice.eth
        bytes32 namehash = keccak256(abi.encodePacked(ethNode, labelHash));

        // ============================================
        // 4. PREPARAR DATA PARA RESOLVER (IGUAL QUE EN run())
        // ============================================

        // Data: Misma configuración de setAddr que en run()
        bytes[] memory data = new bytes[](1);
        data[0] = abi.encodeWithSignature("setAddr(bytes32,address)", namehash, owner);

        // ============================================
        // 5. CALCULAR PRECIO Y REGISTRAR
        // ============================================

        /**
         * @dev Obtener interfaz del controlador
         *
         * Usamos la dirección del controlador específica de la red detectada
         */
        IETHRegistrarController controller = IETHRegistrarController(config.registrarController);

        /**
         * @dev rentPrice(): Consulta el precio ACTUAL del registro
         *
         * IMPORTANTE: El precio puede haber cambiado desde run()
         * Por eso consultamos nuevamente aquí
         */
        uint256 price = controller.rentPrice(ensName, duration);
        console.log("\n=== PRICING INFORMATION ===");
        console.log("Registration price (wei):", price);
        console.log("Registration price (ETH):", price / 1e18);

        if (config.chainId == 1) {
            console.log("\nFINAL WARNING: About to spend", price / 1e18, "ETH on MAINNET!");
        }

        /**
         * @dev Cálculo del valor a enviar: precio + 10% extra
         *
         * ¿Por qué enviar 10% extra?
         * - El precio puede subir ligeramente entre consulta y ejecución
         * - Los contratos ENS pueden tener variaciones en el precio
         * - El exceso se devuelve automáticamente (ENS es seguro)
         *
         * Cálculo:
         * valueToSend = price * 110 / 100
         *             = price * 1.10
         *             = price + (price * 10%)
         *
         * Ejemplo: si price = 1 ETH
         * valueToSend = 1.1 ETH
         */
        uint256 valueToSend = (price * 110) / 100;
        console.log("Sending value:", valueToSend);

        /**
         * @dev register(): Completa el registro del nombre ENS
         *
         * Esta es la transacción PAYABLE que registra el nombre
         * {value: valueToSend} envía ETH junto con la transacción
         *
         * ENS valida que:
         * 1. El commitment existe en blockchain
         * 2. Han pasado mínimo 60 segundos desde commit()
         * 3. Los parámetros coinciden con el commitment
         * 4. Se envió suficiente ETH para pagar
         *
         * Si todo es válido:
         * - Registra el nombre alice.eth a favor de owner
         * - Configura el resolver automáticamente
         * - Ejecuta setAddr para resolver alice.eth -> owner
         * - Configura reverse record (owner -> alice.eth)
         * - Devuelve el ETH excedente (si enviaste más del precio)
         */
        controller.register{value: valueToSend}(
            ensName,
            owner,
            duration,
            secret,
            config.publicResolver, // Usamos el resolver específico de la red
            data,
            true,  // reverseRecord: Configura resolución inversa (address -> nombre)
            0      // ownerControlledFuses: Sin restricciones de permisos
        );

        // ============================================
        // 6. CONFIRMAR ÉXITO Y MOSTRAR INFORMACIÓN
        // ============================================

        console.log("\n=== SUCCESS ===");
        console.log("ENS name registered successfully on", config.name, "!");
        console.log("Your ENS:", string.concat(ensName, ".eth"));
        console.log("Owner:", owner);

        /**
         * @dev Mostrar enlace de verificación según la red
         */
        if (config.chainId == 1) {
            console.log("\nVerify on Mainnet Etherscan:");
            console.log("https://etherscan.io/enslookup-search?search=%s.eth", ensName);
            console.log("\nVerify on ENS App (Mainnet):");
            console.log("https://app.ens.domains/%s.eth", ensName);
        } else {
            console.log("\nVerify on Sepolia Etherscan:");
            console.log("https://sepolia.etherscan.io/enslookup-search?search=%s.eth", ensName);
        }

        // Detener broadcast de transacciones
        vm.stopBroadcast();
    }

    /**
     * @notice PASO 3: Verifica que el nombre ENS esté resolviendo correctamente
     * @dev Esta función es VIEW (solo lectura), no envía transacciones ni cuesta gas
     *
     * @dev FLUJO DE EJECUCIÓN:
     *      1. Lee el nombre ENS desde variables de entorno
     *      2. Obtiene la dirección esperada del owner
     *      3. Calcula el namehash del nombre
     *      4. Consulta el resolver para obtener la dirección configurada
     *      5. Compara la dirección configurada con la esperada
     *      6. Muestra el resultado de la verificación
     *
     * @dev POSIBLES RESULTADOS:
     *      ✅ SUCCESS: ENS resuelve correctamente a tu dirección
     *      ❌ ERROR: ENS no está configurado (returns address(0))
     *      ⚠️  WARNING: ENS resuelve a una dirección diferente
     *      💥 ERROR: No se puede resolver el nombre (no registrado)
     *
     * @dev CUÁNDO USAR:
     *      - Después de ejecutar completeRegistration()
     *      - Para confirmar que el registro fue exitoso
     *      - Para diagnosticar problemas de resolución
     *
     * @dev EJEMPLO DE USO:
     *      forge script script/RegisterENS.s.sol:RegisterENS --sig 'verifyRegistration()' --rpc-url sepolia
     *
     * @dev NOTA: No necesita --broadcast porque es una función view (solo lectura)
     */
    function verifyRegistration() external view {
        // ============================================
        // 1. DETECTAR RED Y CARGAR CONFIGURACIÓN
        // ============================================

        /**
         * @dev Obtener configuración de red automáticamente
         *
         * Necesitamos saber en qué red estamos para:
         * - Usar el resolver correcto
         * - Mostrar los enlaces correctos de verificación
         */
        NetworkConfig memory config = getNetworkConfig();

        console.log("=== NETWORK DETECTION ===");
        console.log("Network:", config.name);
        console.log("Chain ID:", config.chainId);

        // ============================================
        // 2. CARGAR NOMBRE ENS A VERIFICAR
        // ============================================

        // Lee el nombre ENS a verificar
        string memory ensName = vm.envString("ENS_NAME");

        // Variable para almacenar la dirección esperada (owner)
        address expectedAddress;

        /**
         * @dev Obtener la dirección que debería resolver el nombre ENS
         *
         * Esta es la misma dirección que usamos en run() y completeRegistration()
         * Si todo funciona bien, el resolver debería devolver esta dirección
         */
        try vm.envString("MNEMONIC") returns (string memory mnemonic) {
            // Opción 1: Derivar dirección desde mnemonic
            uint32 index = uint32(vm.envOr("MNEMONIC_INDEX", uint256(0)));
            uint256 privateKey = vm.deriveKey(mnemonic, index);
            expectedAddress = vm.addr(privateKey);
        } catch {
            // Opción 2: Derivar dirección desde private key
            uint256 privateKey = vm.envUint("PRIVATE_KEY");
            expectedAddress = vm.addr(privateKey);
        }

        // ============================================
        // 2. CALCULAR NAMEHASH DEL NOMBRE ENS
        // ============================================

        /**
         * @dev Recalcular el namehash para consultar el resolver
         *
         * Usamos el mismo algoritmo que en run() y completeRegistration()
         * para asegurarnos de consultar el nombre correcto
         */

        // ethNode: Hash del dominio raíz "eth"
        bytes32 ethNode = 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae;

        // labelHash: Hash del nombre específico (ej: "alice")
        bytes32 labelHash = keccak256(abi.encodePacked(ensName));

        // namehash: Identificador del nombre completo (ej: "alice.eth")
        bytes32 namehash = keccak256(abi.encodePacked(ethNode, labelHash));

        console.log("=== ENS Verification ===");
        console.log("ENS Name:", string.concat(ensName, ".eth"));
        console.log("Expected Address:", expectedAddress);
        console.log("\nNamehash:");
        console.logBytes32(namehash);

        // ============================================
        // 3. CONSULTAR EL RESOLVER
        // ============================================

        /**
         * @dev Obtener interfaz del resolver público
         *
         * Usamos el resolver específico de la red detectada
         */
        IPublicResolver resolver = IPublicResolver(config.publicResolver);

        /**
         * @dev try/catch para manejar posibles errores al consultar el resolver
         *
         * El try se ejecuta si la consulta es exitosa
         * El catch se ejecuta si hay un error (ej: nombre no registrado)
         */
        try resolver.addr(namehash) returns (address resolvedAddr) {
            /**
             * @dev resolver.addr(namehash) consulta qué dirección está configurada
             *
             * Esta es una llamada view (solo lectura) que consulta el storage
             * del contrato resolver sin modificar estado ni costar gas
             *
             * Retorna:
             * - La dirección configurada si existe
             * - address(0) si no está configurada
             */

            console.log("\nResolved Address:", resolvedAddr);

            // ============================================
            // 4. VALIDAR RESULTADO Y MOSTRAR DIAGNÓSTICO
            // ============================================

            if (resolvedAddr == expectedAddress) {
                /**
                 * @dev ✅ CASO ÉXITO: La dirección resuelta coincide con la esperada
                 *
                 * Esto significa que:
                 * - El nombre fue registrado correctamente
                 * - El resolver está configurado
                 * - setAddr() se ejecutó exitosamente
                 * - El nombre ENS está listo para usarse en dApps
                 */
                console.log("\n SUCCESS! ENS is resolving correctly!");
                console.log("Your ENS", string.concat(ensName, ".eth"), "points to", expectedAddress);

            } else if (resolvedAddr == address(0)) {
                /**
                 * @dev ❌ CASO ERROR: El resolver devuelve address(0)
                 *
                 * Esto significa que:
                 * - El nombre puede estar registrado PERO
                 * - El resolver NO tiene configurada una dirección
                 * - setAddr() no se ejecutó o falló
                 *
                 * Solución: Ejecutar SetENSAddress.s.sol para configurar manualmente
                 */
                console.log("\n ERROR: ENS is NOT set up yet (returns zero address)");
                console.log("\nTo fix this, run:");
                console.log("forge script script/SetENSAddress.s.sol:SetENSAddress --rpc-url sepolia --broadcast");

            } else {
                /**
                 * @dev ⚠️ CASO WARNING: El resolver devuelve una dirección diferente
                 *
                 * Esto puede ocurrir si:
                 * - Alguien más modificó la dirección del resolver
                 * - Usaste una cuenta diferente
                 * - El nombre ya estaba registrado por otro usuario
                 *
                 * Requiere investigación manual para entender qué sucedió
                 */
                console.log("\n WARNING: ENS resolves to different address");
                console.log("Expected:", expectedAddress);
                console.log("Got:", resolvedAddr);
            }

        } catch {
            /**
             * @dev 💥 CASO ERROR: La consulta al resolver falló completamente
             *
             * Esto puede ocurrir si:
             * - El nombre no está registrado en absoluto
             * - El nombre no tiene un resolver configurado
             * - Hay un problema de conectividad con el RPC
             *
             * Solución: Verificar que completeRegistration() se ejecutó exitosamente
             */
            console.log("\n ERROR: Failed to resolve ENS name");
            console.log("The name might not be registered yet.");
        }

        // ============================================
        // 5. MOSTRAR ENLACES ÚTILES
        // ============================================

        /**
         * @dev Proporcionar enlace directo según la red
         *
         * Etherscan permite verificar visualmente:
         * - Si el nombre está registrado
         * - Quién es el owner
         * - Qué dirección resuelve
         * - Cuándo expira el registro
         */
        if (config.chainId == 1) {
            console.log("\nVerify on Mainnet Etherscan:");
            console.log("https://etherscan.io/enslookup-search?search=%s.eth", ensName);
            console.log("\nVerify on ENS App (Mainnet):");
            console.log("https://app.ens.domains/%s.eth", ensName);
        } else {
            console.log("\nVerify on Sepolia Etherscan:");
            console.log("https://sepolia.etherscan.io/enslookup-search?search=%s.eth", ensName);
        }
    }
}
