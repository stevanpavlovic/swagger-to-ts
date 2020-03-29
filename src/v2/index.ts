import prettier from 'prettier';
import { OpenAPI2, OpenAPI2SchemaObject, Property } from '../types/index';
import { tsUnionOf, tsArrayOf } from '../utils/index';

export const PRETTIER_OPTIONS: prettier.Options = { parser: 'typescript', singleQuote: true };

export const PRIMITIVES: { [key: string]: 'boolean' | 'string' | 'number' } = {
  // boolean types
  boolean: 'boolean',

  // string types
  binary: 'string',
  byte: 'string',
  date: 'string',
  dateTime: 'string',
  password: 'string',
  string: 'string',

  // number types
  double: 'number',
  float: 'number',
  integer: 'number',
  number: 'number',
};

export const WARNING_MESSAGE = `/**
 * This file was auto-generated by swagger-to-ts.
 * Do not make direct changes to the file.
 */
`;

export default function generateTypesV2(
  schema: OpenAPI2,
  propertyMapper?: (schemaObject: OpenAPI2SchemaObject, property: Property) => Property
): string {
  if (!schema.definitions) {
    throw new Error(`no definitions in schema`);
  }

  // remove custom properties
  const noCustomProperties = JSON.parse(JSON.stringify(schema.definitions), (key, node) =>
    key.startsWith('x-') ? undefined : node
  );

  // expand $refs
  const expandedRefs = JSON.parse(JSON.stringify(noCustomProperties), (_, node) =>
    node && node['$ref'] ? `definitions["${node.$ref.replace('#/definitions/', '')}"]` : node
  );

  // transform to workable format
  const transformed = JSON.parse(JSON.stringify(expandedRefs), (_, node: OpenAPI2SchemaObject) => {
    // skip if node is already transformed, or not an object
    if (!node || typeof node !== 'object') {
      return node as any;
    }

    // type: enum
    if (Array.isArray(node.enum)) {
      return tsUnionOf(node.enum);
    }

    // type: string / number / boolean
    const primitive = node.type && PRIMITIVES[node.type];
    if (primitive) {
      return primitive;
    }

    // type: array
    if (node.type === 'array' && typeof node.items === 'string') {
      return tsArrayOf(node.items);
    }

    // type: object
    if (node.properties) {
      return node.properties;
    } else if (node.type === 'object') {
      return `{ [key: string]: any }`;
    }

    // return by default
    return node;
  });

  return prettier.format(
    `${WARNING_MESSAGE} export interface definitions ${JSON.stringify(transformed)}`,
    PRETTIER_OPTIONS
  );
}
