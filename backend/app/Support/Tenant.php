<?php

namespace App\Support;

class Tenant
{
    public ?string $organizationId = null;

    public function set(?string $organizationId): void
    {
        $this->organizationId = $organizationId;
    }

    public function id(): ?string
    {
        return $this->organizationId;
    }

    public function requireId(): string
    {
        if (! $this->organizationId) {
            abort(422, 'Organisasi aktif wajib dipilih.');
        }

        return $this->organizationId;
    }
}
