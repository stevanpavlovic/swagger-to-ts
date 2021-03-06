import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import prettier from 'prettier';
import swaggerToTS, { Swagger2Definition, Property } from '../../src';
import { Swagger2, warningMessage } from '../../src/swagger-2';

const EXAMPLE_DIR = path.resolve(__dirname, '..', '..', 'example');

/* eslint-disable @typescript-eslint/explicit-function-return-type */

// Let Prettier handle formatting, not the test expectations
function format(spec: string, wrapper = 'declare namespace OpenAPI2'): string {
  return prettier.format(
    `${warningMessage}

    ${wrapper} {
      ${spec}
    }
    `,
    {
      parser: 'typescript',
      singleQuote: true,
    }
  );
}

describe('Swagger 2 spec', () => {
  describe('core Swagger types', () => {
    it('string -> string', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              email: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        email?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('integer -> number', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              age: { type: 'integer' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        age?: number;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('number -> number', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              lat: { type: 'number', format: 'float' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        lat?: number;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('boolean -> boolean', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              active: { type: 'boolean' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        active?: boolean;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('undefined -> object', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          BrokerStatus: {
            properties: {
              address: { type: 'string' },
              certifiedFee: { type: 'integer' },
            },
            required: ['address', 'certifiedFee'],
          },
        },
      };

      const ts = format(`
      export interface BrokerStatus {
        address: string;
        certifiedFee: number;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });
  });

  describe('complex structures', () => {
    it('handles arrays of primitive structures', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              teams: { type: 'array', items: { type: 'string' } },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        teams?: string[];
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('handles arrays of references', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          Team: {
            properties: {
              id: { type: 'string' },
            },
            type: 'object',
          },
          User: {
            properties: {
              teams: { type: 'array', items: { $ref: '#/definitions/Team' } },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        teams?: Team[];
      }
      export interface Team {
        id?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('handles nested objects', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              remote_id: {
                type: 'object',
                properties: { id: { type: 'string' } },
              },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        remote_id?: UserRemoteId;
      }
      export interface UserRemoteId {
        id?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('handles arrays of nested objects', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              remote_ids: {
                type: 'array',
                items: { type: 'object', properties: { id: { type: 'string' } } },
              },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        remote_ids?: UserRemoteIds[];
      }
      export interface UserRemoteIds {
        id?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('handles arrays of arrays of arrays', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          Resource: {
            properties: {
              environments: {
                type: 'array',
                items: {
                  type: 'array',
                  items: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface Resource {
        environments?: string[][][];
      }
      `);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('handles allOf', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          Admin: {
            allOf: [
              { $ref: '#/definitions/User' },
              {
                properties: {
                  rbac: { type: 'string' },
                },
                type: 'object',
              },
            ],
            type: 'object',
          },
          User: {
            properties: {
              email: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        email?: string;
      }
      export interface Admin extends User {
        rbac?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('handles oneOf', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          Record: {
            properties: {
              rand: {
                oneOf: [{ type: 'string' }, { type: 'number' }],
                type: 'array',
              },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface Record {
        rand?: string | number;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('handles enum', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              role: { type: 'string', enum: ['user', 'admin'] },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        role?: 'user' | 'admin';
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });
  });

  describe('property names', () => {
    it('preserves snake_case keys by default', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              profile_image: { type: 'string' },
              address_line_1: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        profile_image?: string;
        address_line_1?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('converts snake_case to camelCase if specified', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User_Team: {
            properties: {
              id: { type: 'string' },
            },
            type: 'object',
          },
          User: {
            properties: {
              profile_image: { type: 'string' },
              address_line_1: { type: 'string' },
              user_team: { $ref: '#/definitions/User_Team' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface UserTeam {
        id?: string;
      }
      export interface User {
        profileImage?: string;
        addressLine1?: string;
        userTeam?: UserTeam;
      }`);

      expect(swaggerToTS(swagger, { camelcase: true })).toBe(ts);
    });

    it('handles kebab-case property names', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              'profile-image': { type: 'string' },
              'address-line-1': { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        'profile-image'?: string;
        'address-line-1'?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('converts names with spaces to names with underscores', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          'User 1': {
            properties: {
              profile_image: { type: 'string' },
              address_line_1: { type: 'string' },
            },
            type: 'object',
          },
          'User 1 Being Used': {
            properties: {
              user: { $ref: '#/definitions/User 1' },
              user_array: {
                type: 'array',
                items: { $ref: '#/definitions/User 1' },
              },
              all_of_user: {
                allOf: [
                  { $ref: '#/definitions/User 1' },
                  {
                    properties: {
                      other_field: { type: 'string' },
                    },
                    type: 'object',
                  },
                ],
                type: 'object',
              },
              wrapper: {
                properties: {
                  user: { $ref: '#/definitions/User 1' },
                },
                type: 'object',
              },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User_1_Being_Used {
        user?: User_1;
        user_array?: User_1[];
        all_of_user?: object;
        wrapper?: User1BeingUsedWrapper;
      }
      export interface User1BeingUsedWrapper {
         user?: User_1;
      }
      export interface User_1 {
        'profile_image'?: string;
        'address_line_1'?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });
  });

  describe('TS features', () => {
    it('specifies required types', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              username: { type: 'string' },
            },
            required: ['username'],
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface User {
        username: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('flattens single-type $refs', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          User: {
            properties: {
              password: { $ref: '#/definitions/UserPassword' },
            },
            type: 'object',
          },
          UserPassword: {
            type: 'string',
          },
        },
      };

      const ts = format(`
      export interface User {
        password?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });
  });

  it('can deal with additionalProperties: true', () => {
    const swagger: Swagger2 = {
      swagger: '2.0',
      definitions: {
        FeatureMap: {
          type: 'object',
          additionalProperties: true,
        },
      },
    };

    const ts = format(`
    export interface FeatureMap {
      [key: string]: any;
    }`);

    expect(swaggerToTS(swagger)).toBe(ts);
  });

  it('can deal with additionalProperties of type', () => {
    const swagger: Swagger2 = {
      swagger: '2.0',
      definitions: {
        CamundaFormField: {
          type: 'object',
          required: ['displayType', 'id', 'label', 'options', 'responseType'],
          properties: {
            displayType: {
              type: 'string',
              enum: ['radio', 'date', 'select', 'textfield', 'unknown'],
            },
            id: { type: 'string' },
            label: { type: 'string' },
            options: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
            responseType: {
              type: 'string',
              enum: [
                'booleanField',
                'stringField',
                'longField',
                'enumField',
                'dateField',
                'customTypeField',
                'unknownFieldType',
              ],
            },
            value: { type: 'string' },
          },
          title: 'CamundaFormField',
        },
      },
    };

    const ts = format(`
    export interface CamundaFormField {
      displayType: 'radio' | 'date' | 'select' | 'textfield' | 'unknown';
      id: string;
      label: string;
      options: { [key: string]: string }
      responseType:
        | 'booleanField'
        | 'stringField'
        | 'longField'
        | 'enumField'
        | 'dateField'
        | 'customTypeField'
        | 'unknownFieldType';
      value?: string;
    }`);

    expect(swaggerToTS(swagger)).toBe(ts);
  });

  describe('other output', () => {
    it('skips top-level array definitions', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          Colors: {
            type: 'array',
            items: { $ref: '#/definitions/Color' },
          },
          Color: { type: 'string' },
        },
      };

      const ts = format('');

      expect(swaggerToTS(swagger)).toBe(ts);
    });
  });

  describe('wrapper option', () => {
    it('has a default wrapper', () => {
      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          Name: {
            properties: {
              first: { type: 'string' },
              last: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(`
      export interface Name {
        first?: string;
        last?: string;
      }`);

      expect(swaggerToTS(swagger)).toBe(ts);
    });

    it('allows namespace wrappers', () => {
      const wrapper = 'export namespace MyNamespace';

      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          Name: {
            properties: {
              first: { type: 'string' },
              last: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(
        `
      export interface Name {
        first?: string;
        last?: string;
      }`,
        wrapper
      );

      expect(swaggerToTS(swagger, { wrapper })).toBe(ts);
    });

    it('allows module wrappers', () => {
      const wrapper = 'declare module MyNamespace';

      const swagger: Swagger2 = {
        swagger: '2.0',
        definitions: {
          Name: {
            properties: {
              first: { type: 'string' },
              last: { type: 'string' },
            },
            type: 'object',
          },
        },
      };

      const ts = format(
        `
      export interface Name {
        first?: string;
        last?: string;
      }`,
        wrapper
      );

      expect(swaggerToTS(swagger, { wrapper })).toBe(ts);
    });
  });

  describe('properties mapper', () => {
    const swagger: Swagger2 = {
      swagger: '2.0',
      definitions: {
        Name: {
          properties: {
            first: { type: 'string' },
            last: { type: 'string', 'x-nullable': false },
          },
          type: 'object',
        },
      },
    };

    it('accepts a mapper in options', () => {
      const propertyMapper = (
        swaggerDefinition: Swagger2Definition,
        property: Property
      ): Property => property;
      swaggerToTS(swagger, { propertyMapper });
    });

    it('passes definition to mapper', () => {
      const propertyMapper = jest.fn((_, prop) => prop);
      swaggerToTS(swagger, { propertyMapper });
      if (!swagger.definitions.Name.properties) {
        throw new Error('properties missing');
      }
      expect(propertyMapper).toBeCalledWith(
        swagger.definitions.Name.properties.first,
        expect.any(Object)
      );
    });

    it('Uses result of mapper', () => {
      const wrapper = 'declare module MyNamespace';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getNullable = (d: { [key: string]: any }): boolean => {
        const nullable = d['x-nullable'];
        if (typeof nullable === 'boolean') {
          return nullable;
        }
        return true;
      };

      const propertyMapper = (
        swaggerDefinition: Swagger2Definition,
        property: Property
      ): Property => ({ ...property, optional: getNullable(swaggerDefinition) });

      swaggerToTS(swagger, { propertyMapper });

      const ts = format(
        `
      export interface Name {
        first?: string;
        last: string;
      }
      `,
        wrapper
      );

      expect(swaggerToTS(swagger, { wrapper, propertyMapper })).toBe(ts);
    });
  });

  describe('snapshots', () => {
    // Basic snapshot test.
    // If changes are all good, run `npm run generate` to update (⚠️ This will cement your changes so be sure they’re 100% correct!)
    it('basic', () => {
      const input = yaml.safeLoad(
        fs.readFileSync(path.resolve(EXAMPLE_DIR, 'basic.yaml'), 'UTF-8')
      );
      const output = fs.readFileSync(path.resolve(EXAMPLE_DIR, 'basic.ts'), 'UTF-8');
      expect(swaggerToTS(input)).toBe(output);
    });

    it('no warning', () => {
      const input = yaml.safeLoad(
        fs.readFileSync(path.resolve(EXAMPLE_DIR, 'basic.yaml'), 'UTF-8')
      );
      const output = fs.readFileSync(path.resolve(EXAMPLE_DIR, 'no-warning.ts'), 'UTF-8');
      expect(swaggerToTS(input, { warning: false })).toBe(output);
    });

    it('no wrapper', () => {
      const input = yaml.safeLoad(
        fs.readFileSync(path.resolve(EXAMPLE_DIR, 'basic.yaml'), 'UTF-8')
      );
      const output = fs.readFileSync(path.resolve(EXAMPLE_DIR, 'no-wrapper.ts'), 'UTF-8');
      expect(swaggerToTS(input, { wrapper: false })).toBe(output);
    });

    it('no types', () => {
      const input = yaml.safeLoad(
        fs.readFileSync(path.resolve(EXAMPLE_DIR, 'no-types.yaml'), 'UTF-8')
      );
      const output = fs.readFileSync(path.resolve(EXAMPLE_DIR, 'no-types.ts'), 'UTF-8');
      expect(swaggerToTS(input)).toBe(output);
    });
  });
});
