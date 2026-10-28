<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CertificatePublicController;
use App\Http\Controllers\Api\CompetencyController;
use App\Http\Controllers\Api\IssueController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\TrainingController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::get('/certificates/verify/{token}', [CertificatePublicController::class, 'verify']);

Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/organization', [AuthController::class, 'switchOrganization']);

    Route::get('/dashboard', [CompetencyController::class, 'dashboard']);
    Route::get('/competencies', [CompetencyController::class, 'index']);
    Route::get('/certificates', [CompetencyController::class, 'certificates']);

    Route::get('/programs', [TrainingController::class, 'programs']);
    Route::get('/programs/{program}', [TrainingController::class, 'showProgram']);
    Route::get('/lessons/{lesson}', [TrainingController::class, 'lesson']);
    Route::post('/quizzes/{quiz}/attempts', [TrainingController::class, 'attemptQuiz']);
    Route::get('/labs', [TrainingController::class, 'labs']);
    Route::get('/labs/{lab}', [TrainingController::class, 'showLab']);
    Route::get('/challenges', [TrainingController::class, 'challenges']);
    Route::get('/challenges/{challenge}', [TrainingController::class, 'showChallenge']);

    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::put('/projects/{project}', [ProjectController::class, 'update']);
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);
    Route::get('/projects/{project}/document', [ProjectController::class, 'document']);
    Route::put('/projects/{project}/document', [ProjectController::class, 'saveDocument']);
    Route::post('/projects/{project}/operations', [ProjectController::class, 'operations']);
    Route::match(['get', 'post'], '/projects/{project}/levels', [ProjectController::class, 'levels']);
    Route::put('/projects/{project}/levels/{level}', [ProjectController::class, 'updateLevel']);
    Route::delete('/projects/{project}/levels/{level}', [ProjectController::class, 'destroyLevel']);
    Route::match(['get', 'post'], '/projects/{project}/grids', [ProjectController::class, 'grids']);
    Route::put('/projects/{project}/grids/{grid}', [ProjectController::class, 'updateGrid']);
    Route::delete('/projects/{project}/grids/{grid}', [ProjectController::class, 'destroyGrid']);
    Route::match(['get', 'post'], '/projects/{project}/elements', [ProjectController::class, 'elements']);
    Route::put('/projects/{project}/elements/{element}', [ProjectController::class, 'updateElement']);
    Route::delete('/projects/{project}/elements/{element}', [ProjectController::class, 'destroyElement']);
    Route::post('/projects/{project}/elements/batch', [ProjectController::class, 'batchElements']);
    Route::match(['get', 'post'], '/projects/{project}/versions', [ProjectController::class, 'versions']);
    Route::get('/projects/{project}/versions/{version}', [ProjectController::class, 'showVersion']);
    Route::post('/projects/{project}/validate', [ProjectController::class, 'validateModel']);
    Route::post('/projects/{project}/submit', [SubmissionController::class, 'submit']);
    Route::post('/projects/{project}/ifc/export', [ProjectController::class, 'exportIfc']);
    Route::get('/ifc/jobs/{id}', [ProjectController::class, 'ifcJob']);

    Route::get('/projects/{project}/issues', [IssueController::class, 'index']);
    Route::post('/projects/{project}/issues', [IssueController::class, 'store']);
    Route::put('/issues/{issue}', [IssueController::class, 'update']);
    Route::post('/issues/{issue}/comments', [IssueController::class, 'comment']);

    Route::get('/submissions', [SubmissionController::class, 'index']);
    Route::get('/submissions/{submission}', [SubmissionController::class, 'show']);
    Route::post('/submissions/{submission}/review', [SubmissionController::class, 'review']);
    Route::post('/submissions/{submission}/revision', [SubmissionController::class, 'revision']);
    Route::post('/submissions/{submission}/approve', [SubmissionController::class, 'approve']);
});
