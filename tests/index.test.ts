import { OpenAPI2, Swagger2TSOptions } from '../src/types';
import swaggerToTS from '../src';

describe('OpenAPI 2', () => {
  describe('wrapper', () => {
    it('false', () => {
      const schema = { swagger: '2.0', definitions: {} } as OpenAPI2;
      const options: Swagger2TSOptions = { wrapper: false, warning: false };
      expect(swaggerToTS(schema, options)).toBe('');
    });
  });
});
