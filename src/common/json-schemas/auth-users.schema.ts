export const AUTH_USERS_JSON_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'ERP Auth and Users API Schemas',
  type: 'object',
  properties: {
    registerRequest: {
      type: 'object',
      required: ['usuario', 'email', 'password', 'nombreCompleto', 'fechaNacimiento'],
      properties: {
        usuario: { type: 'string', minLength: 3, maxLength: 80 },
        email: { type: 'string', format: 'email', minLength: 5, maxLength: 150 },
        password: {
          type: 'string',
          minLength: 10,
          pattern: "^(?=.*[!@#$%^&*()_\\-+=[\\]{};:'\"\\\\|,.<>/?]).{10,}$",
        },
        nombreCompleto: { type: 'string', minLength: 3, maxLength: 180 },
        direccion: { type: 'string', maxLength: 1000 },
        telefono: { type: 'string', minLength: 7, maxLength: 40 },
        fechaNacimiento: { type: 'string', format: 'date' },
      },
      additionalProperties: false,
    },
    loginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', minLength: 5, maxLength: 150 },
        password: { type: 'string', minLength: 1, maxLength: 255 },
      },
      additionalProperties: false,
    },
    createUserRequest: {
      type: 'object',
      required: ['usuario', 'email', 'password', 'nombreCompleto', 'fechaNacimiento'],
      properties: {
        usuario: { type: 'string', minLength: 3, maxLength: 80 },
        email: { type: 'string', format: 'email', minLength: 5, maxLength: 150 },
        password: {
          type: 'string',
          minLength: 10,
          pattern: "^(?=.*[!@#$%^&*()_\\-+=[\\]{};:'\"\\\\|,.<>/?]).{10,}$",
        },
        nombreCompleto: { type: 'string', minLength: 3, maxLength: 180 },
        direccion: { type: 'string', maxLength: 1000 },
        telefono: { type: 'string', minLength: 7, maxLength: 40 },
        fechaNacimiento: { type: 'string', format: 'date' },
        permisosGlobales: {
          type: 'array',
          items: { type: 'string' },
          default: [],
        },
      },
      additionalProperties: false,
    },
    authResponse: {
      type: 'object',
      required: ['accessToken', 'user'],
      properties: {
        accessToken: { type: 'string' },
        user: {
          type: 'object',
          required: ['id', 'usuario', 'email', 'nombreCompleto', 'fechaNacimiento', 'permisosGlobales'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            usuario: { type: 'string' },
            email: { type: 'string', format: 'email' },
            nombreCompleto: { type: 'string' },
            direccion: { type: 'string' },
            telefono: { type: 'string' },
            fechaNacimiento: { type: 'string', format: 'date-time' },
            permisosGlobales: { type: 'array', items: { type: 'string' } },
            ultimoLogin: { type: ['string', 'null'], format: 'date-time' },
            creadoEn: { type: 'string', format: 'date-time' },
            actualizadoEn: { type: 'string', format: 'date-time' },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
} as const;
