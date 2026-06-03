declare module '@paypal/checkout-server-sdk' {
  namespace core {
    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    class PayPalHttpClient {
      constructor(environment: SandboxEnvironment | LiveEnvironment);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      execute(request: any): Promise<any>;
    }
  }
  namespace orders {
    class OrdersCreateRequest {
      constructor();
      prefer(header: string): void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      requestBody(body: any): void;
    }
    class OrdersCaptureRequest {
      constructor(orderId: string);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      requestBody(body: any): void;
    }
  }
  namespace payments {
    class AuthorizationsVoidRequest {
      constructor(authorizationId: string);
    }
  }
}
