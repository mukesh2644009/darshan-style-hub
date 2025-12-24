declare module 'swagger-ui-react' {
  import { ComponentType } from 'react';
  
  interface SwaggerUIProps {
    url?: string;
    spec?: object;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelsExpandDepth?: number;
    displayOperationId?: boolean;
    filter?: boolean | string;
    maxDisplayedTags?: number;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    supportedSubmitMethods?: string[];
    tryItOutEnabled?: boolean;
    requestInterceptor?: (req: any) => any;
    responseInterceptor?: (res: any) => any;
    onComplete?: (system: any) => void;
    presets?: any[];
    plugins?: any[];
    layout?: string;
    deepLinking?: boolean;
    persistAuthorization?: boolean;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}

