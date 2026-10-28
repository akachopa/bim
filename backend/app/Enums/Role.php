<?php

namespace App\Enums;

enum Role: string
{
    case SuperAdmin = 'super_admin';
    case OrgAdmin = 'org_admin';
    case Trainer = 'trainer';
    case Participant = 'participant';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::OrgAdmin => 'Admin Lembaga',
            self::Trainer => 'Trainer',
            self::Participant => 'Peserta',
        };
    }
}
