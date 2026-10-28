<?php

namespace App\Http\Middleware;

use App\Support\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        abort_unless($user, 401);

        if ($user->is_super_admin) {
            return $next($request);
        }

        $orgId = app(Tenant::class)->id() ?? $user->current_organization_id;
        abort_unless($orgId, 403, 'Organisasi belum dipilih.');

        $role = $user->roleIn($orgId);
        abort_unless($role && in_array($role, $roles, true), 403, 'Peran tidak diizinkan.');

        return $next($request);
    }
}
