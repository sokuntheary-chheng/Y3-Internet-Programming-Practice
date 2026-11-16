import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// "deathDate must not be before birthDate" (contract). A property validator,
// because class-validator only compares one field at a time by default: the
// date we compare against lives on the same object.
export function IsAfterBirth(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterBirth',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (typeof value !== 'string') return true; // optional field
          const birth = (args.object as { birthDate?: string }).birthDate;
          if (!birth) return true; // no birth date given: nothing to compare
          return new Date(value).getTime() >= new Date(birth).getTime();
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must not be before birthDate`;
        },
      },
    });
  };
}
