<?php

namespace TuranFurkan\CoreCms\Domains\Identity\Exceptions;

use RuntimeException;

class RegistrationException extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $statusCode = 422,
        public readonly array $errors = [],
    ) {
        parent::__construct($message);
    }

    public static function phoneAlreadyUsed(): self
    {
        return new self(
            errorCode: 'USER.PHONE_ALREADY_USED',
            message: 'A user with this phone number already exists.',
            statusCode: 422,
            errors: ['phone' => ['The phone has already been taken.']],
        );
    }

    public static function emailAlreadyUsed(): self
    {
        return new self(
            errorCode: 'USER.EMAIL_ALREADY_USED',
            message: 'A user with this email already exists.',
            statusCode: 422,
            errors: ['email' => ['The email has already been taken.']],
        );
    }

    public static function roleAssignmentForbidden(string $targetRole): self
    {
        return new self(
            errorCode: 'AUTH.ROLE_ASSIGNMENT_FORBIDDEN',
            message: "You are not allowed to assign the role [{$targetRole}].",
            statusCode: 403,
            errors: ['role' => ['You cannot assign this role.']],
        );
    }

    public static function invalidRole(string $targetRole): self
    {
        return new self(
            errorCode: 'USER.INVALID_ROLE',
            message: "The role [{$targetRole}] is not valid.",
            statusCode: 422,
            errors: ['role' => ['The selected role is invalid.']],
        );
    }
}
