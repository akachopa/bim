<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\JsonResponse;

class CertificatePublicController extends Controller
{
    public function verify(string $token): JsonResponse
    {
        $certificate = Certificate::query()
            ->withoutGlobalScopes()
            ->with(['user:id,name,email', 'program:id,title,code', 'organization:id,name'])
            ->where(function ($query) use ($token) {
                $query->where('verification_token', $token)
                    ->orWhere('certificate_number', $token);
            })
            ->firstOrFail();

        return response()->json([
            'valid' => true,
            'data' => [
                'certificate_number' => $certificate->certificate_number,
                'participant' => $certificate->user?->name,
                'program' => $certificate->program?->title,
                'organization' => $certificate->organization?->name,
                'competency_level' => $certificate->competency_level,
                'final_score' => $certificate->final_score,
                'issued_at' => $certificate->issued_at,
                'verification_url' => rtrim((string) env('CERTIFICATE_PUBLIC_URL', '/verify'), '/').'/'.$certificate->verification_token,
            ],
        ]);
    }
}
