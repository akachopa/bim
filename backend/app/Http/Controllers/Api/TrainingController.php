<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BimLab;
use App\Models\Challenge;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\TrainingProgram;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrainingController extends Controller
{
    public function programs(): JsonResponse
    {
        $programs = TrainingProgram::query()
            ->with(['modules.lessons.contents', 'classes'])
            ->orderBy('title')
            ->get();

        return response()->json(['data' => $programs]);
    }

    public function showProgram(TrainingProgram $program): JsonResponse
    {
        $this->authorize('view', $program);
        $program->load(['modules.lessons.contents', 'modules.lessons.quiz.questions', 'classes.enrollments']);

        return response()->json(['data' => $program]);
    }

    public function lesson(Lesson $lesson): JsonResponse
    {
        $lesson->load(['contents', 'quiz.questions', 'module.program']);

        return response()->json(['data' => $lesson]);
    }

    public function attemptQuiz(Request $request, Quiz $quiz): JsonResponse
    {
        $data = $request->validate([
            'answers' => ['required', 'array'],
        ]);
        $quiz->load('questions');
        $correct = 0;
        foreach ($quiz->questions as $question) {
            $given = $data['answers'][$question->id] ?? $data['answers'][(string) $question->id] ?? null;
            if ((int) $given === (int) $question->correct_index) {
                $correct++;
            }
        }
        $total = max(1, $quiz->questions->count());
        $score = (int) round(($correct / $total) * 100);
        $attempt = QuizAttempt::query()->create([
            'organization_id' => app(Tenant::class)->requireId(),
            'quiz_id' => $quiz->id,
            'user_id' => $request->user()->id,
            'answers' => $data['answers'],
            'score' => $score,
            'passed' => $score >= $quiz->passing_score,
        ]);

        return response()->json(['data' => $attempt]);
    }

    public function labs(): JsonResponse
    {
        return response()->json(['data' => BimLab::query()->with('steps')->orderBy('title')->get()]);
    }

    public function showLab(BimLab $lab): JsonResponse
    {
        return response()->json(['data' => $lab->load('steps')]);
    }

    public function challenges(): JsonResponse
    {
        return response()->json(['data' => Challenge::query()->with('rules')->orderBy('title')->get()]);
    }

    public function showChallenge(Challenge $challenge): JsonResponse
    {
        return response()->json(['data' => $challenge->load('rules')]);
    }
}
