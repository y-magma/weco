import { ParamMetadataStore } from '@domain/services/paramMetadataStore'

export { ParamMetadataStore } from '@domain/services/paramMetadataStore'

/** @deprecated Prefer ApplicationContainer.paramMetadata */
export const paramMetadataStore = new ParamMetadataStore()
