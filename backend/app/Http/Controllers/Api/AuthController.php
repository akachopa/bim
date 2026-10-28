<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau kata sandi tidak sesuai.'],
            ]);
        }

        $user->load('organizations');
        $token = $user->createToken('web')->plainTextToken;
        Audit::record('auth.login', $user, [], $user);

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->toAuthArray(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['ok' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('organizations');

        return response()->json(['data' => $user->toAuthArray()]);
    }

    public function switchOrganization(Request $request): JsonResponse
    {
        $data = $request->validate([
            'organization_id' => ['required', 'uuid'],
        ]);
        $user = $request->user();
        $belongs = $user->is_super_admin
            || $user->organizations()->where('organizations.id', $data['organization_id'])->exists();
        abort_unless($belongs, 403);

        $user->update(['current_organization_id' => $data['organization_id']]);
        $user->load('organizations');

        return response()->json(['data' => $user->toAuthArray()]);
    }
}
