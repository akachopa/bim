<?php

namespace App\Http\Middleware;

use App\Support\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentOrganization
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        $orgId = $request->header('X-Organization-Id') ?: $user->current_organization_id;

        if ($orgId) {
            $belongs = $user->is_super_admin
                || $user->organizations()->where('organizations.id', $orgId)->exists();

            abort_unless($belongs, 403, 'Akses organisasi ditolak.');

            app(Tenant::class)->set($orgId);

            if ($user->current_organization_id !== $orgId) {
                $user->forceFill(['current_organization_id' => $orgId])->save();
            }
        }

        return $next($request);
    }
}
