<?php

return [
    'register' => [
        'require_otp_verification' => env('USER_REGISTER_REQUIRE_OTP', false),
        'default_role' => env('USER_DEFAULT_ROLE', 'user'),
    ],

    'phone' => [
        'default_region' => env('PHONE_DEFAULT_REGION', 'TR'),
    ],

    'roles' => [
        'hierarchy' => [
            'super_admin' => 4,
            'admin' => 3,
            'editor' => 2,
            'user' => 1,
        ],
        'critical' => ['super_admin', 'admin'],
    ],

    'otp' => [
        'length' => env('OTP_LENGTH', 6),
        'ttl_minutes' => env('OTP_TTL_MINUTES', 5),
        'max_attempts' => env('OTP_MAX_ATTEMPTS', 5),
        'cooldown_seconds' => env('OTP_COOLDOWN_SECONDS', 60),
        'rate_limit' => [
            'max_requests' => env('OTP_RATE_LIMIT_MAX', 3),
            'decay_minutes' => env('OTP_RATE_LIMIT_DECAY_MINUTES', 10),
        ],
        'sms' => [
            'driver' => env('SMS_DRIVER', 'log'),
            'from' => env('SMS_FROM', 'CORE'),
        ],
        'message_template' => env('OTP_MESSAGE_TEMPLATE', 'CoreCMS giris kodunuz: :code (:ttl_minutes dk gecerli).'),
    ],

    'login' => [
        'max_attempts' => env('LOGIN_MAX_ATTEMPTS', 5),
        'decay_minutes' => env('LOGIN_DECAY_MINUTES', 15),
        'http_max_per_minute' => env('LOGIN_HTTP_MAX_PER_MINUTE', 6),
    ],
];
