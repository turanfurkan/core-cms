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
        'ttl_minutes' => env('OTP_TTL_MINUTES', 5),
        'max_attempts' => env('OTP_MAX_ATTEMPTS', 5),
    ],

    'login' => [
        'max_attempts' => env('LOGIN_MAX_ATTEMPTS', 5),
        'decay_minutes' => env('LOGIN_DECAY_MINUTES', 15),
        'http_max_per_minute' => env('LOGIN_HTTP_MAX_PER_MINUTE', 6),
    ],
];
