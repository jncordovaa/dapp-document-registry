/**
 * Upload Configuration
 *
 * Configuration for file uploads, PDF viewer, and document signing workflow
 */

export const UPLOAD_CONFIG = {
  /**
   * Maximum file size for uploads (10 MB)
   */
  maxFileSize: 10 * 1024 * 1024,

  /**
   * Allowed MIME types for file upload
   */
  allowedTypes: ['application/pdf'],

  /**
   * PDF Viewer Settings
   */
  pdfViewer: {
    /**
     * Default zoom level
     */
    defaultZoom: 1.0,

    /**
     * Available zoom levels
     */
    zoomLevels: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],

    /**
     * Minimum zoom level
     */
    minZoom: 0.5,

    /**
     * Maximum zoom level
     */
    maxZoom: 2.0,

    /**
     * Zoom step for zoom in/out buttons
     */
    zoomStep: 0.25,
  },

  /**
   * IPFS Settings
   */
  ipfs: {
    /**
     * Number of retry attempts for IPFS upload
     */
    maxRetries: 3,

    /**
     * Delay between retries (milliseconds)
     */
    retryDelay: 2000,

    /**
     * Upload timeout (30 seconds)
     */
    uploadTimeout: 30000,
  },

  /**
   * Blockchain Settings
   */
  blockchain: {
    /**
     * Minimum number of confirmations before considering transaction confirmed
     */
    minConfirmations: 2,

    /**
     * Maximum time to wait for transaction confirmation (5 minutes)
     */
    confirmationTimeout: 5 * 60 * 1000,
  },
}

/**
 * Stepper configuration
 */
export const STEPPER_CONFIG = {
  steps: [
    {
      id: 'upload' as const,
      title: 'Upload & Review',
      description: 'Upload PDF and review all pages',
    },
    {
      id: 'sign' as const,
      title: 'Sign & Store',
      description: 'Sign, upload to IPFS, and store on blockchain',
    },
  ],
}

/**
 * Type for step IDs
 */
export type StepId = (typeof STEPPER_CONFIG.steps)[number]['id']
