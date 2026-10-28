<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('code')->unique();
            $table->string('plan')->default('standard');
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('current_organization_id')->references('id')->on('organizations')->nullOnDelete();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->nullable();
            $table->string('name');
            $table->string('slug');
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('organization_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('user_id');
            $table->string('role');
            $table->timestamps();
            $table->unique(['organization_id', 'user_id']);
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('training_programs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('title');
            $table->string('code');
            $table->text('description')->nullable();
            $table->string('status')->default('published');
            $table->unsignedInteger('duration_hours')->default(40);
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('training_classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('training_program_id');
            $table->string('name');
            $table->string('code');
            $table->date('starts_at')->nullable();
            $table->date('ends_at')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('training_program_id')->references('id')->on('training_programs')->cascadeOnDelete();
        });

        Schema::create('training_enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('training_class_id');
            $table->uuid('user_id');
            $table->string('status')->default('active');
            $table->unsignedInteger('progress')->default(0);
            $table->timestamps();
            $table->unique(['training_class_id', 'user_id']);
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('training_class_id')->references('id')->on('training_classes')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('modules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('training_program_id');
            $table->string('title');
            $table->unsignedInteger('sort_order')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('training_program_id')->references('id')->on('training_programs')->cascadeOnDelete();
        });

        Schema::create('lessons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('module_id');
            $table->string('title');
            $table->string('type')->default('article');
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('duration_minutes')->default(15);
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('module_id')->references('id')->on('modules')->cascadeOnDelete();
        });

        Schema::create('lesson_contents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('lesson_id');
            $table->string('kind');
            $table->string('title')->nullable();
            $table->longText('body')->nullable();
            $table->string('url')->nullable();
            $table->uuid('lab_id')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
        });

        Schema::create('quizzes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('lesson_id')->nullable();
            $table->string('title');
            $table->unsignedInteger('passing_score')->default(70);
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('quiz_id');
            $table->text('prompt');
            $table->json('options');
            $table->unsignedInteger('correct_index');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->foreign('quiz_id')->references('id')->on('quizzes')->cascadeOnDelete();
        });

        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('quiz_id');
            $table->uuid('user_id');
            $table->json('answers');
            $table->unsignedInteger('score');
            $table->boolean('passed');
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('quiz_id')->references('id')->on('quizzes')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('bim_labs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('training_program_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('project_template')->nullable();
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('bim_lab_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('bim_lab_id');
            $table->string('title');
            $table->text('instruction');
            $table->string('required_action');
            $table->json('validation_rule')->nullable();
            $table->text('hint')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->foreign('bim_lab_id')->references('id')->on('bim_labs')->cascadeOnDelete();
        });

        Schema::create('challenges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('difficulty')->default('intermediate');
            $table->unsignedInteger('duration_minutes')->default(120);
            $table->unsignedInteger('maximum_score')->default(100);
            $table->unsignedInteger('passing_score')->default(75);
            $table->json('project_template')->nullable();
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('challenge_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('challenge_id');
            $table->string('rule_id');
            $table->string('name');
            $table->string('type');
            $table->json('config');
            $table->unsignedInteger('weight')->default(10);
            $table->timestamps();
            $table->foreign('challenge_id')->references('id')->on('challenges')->cascadeOnDelete();
        });

        Schema::create('project_materials', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('organization_id')->nullable();
            $table->uuid('project_id')->nullable();
            $table->string('name');
            $table->string('code');
            $table->string('color', 16);
            $table->decimal('opacity', 3, 2)->default(1);
            $table->boolean('is_global')->default(false);
            $table->timestamps();
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('owner_id');
            $table->uuid('training_program_id')->nullable();
            $table->uuid('challenge_id')->nullable();
            $table->uuid('bim_lab_id')->nullable();
            $table->string('title');
            $table->string('code');
            $table->text('description')->nullable();
            $table->string('status')->default('draft');
            $table->string('unit')->default('millimeter');
            $table->string('schema_version')->default('1.0.0');
            $table->json('settings')->nullable();
            $table->json('document')->nullable();
            $table->timestamp('last_saved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('owner_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('training_program_id')->references('id')->on('training_programs')->nullOnDelete();
            $table->foreign('challenge_id')->references('id')->on('challenges')->nullOnDelete();
            $table->foreign('bim_lab_id')->references('id')->on('bim_labs')->nullOnDelete();
        });

        Schema::create('project_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->uuid('user_id');
            $table->string('role')->default('editor');
            $table->timestamps();
            $table->unique(['project_id', 'user_id']);
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('project_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->string('name');
            $table->integer('elevation')->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });

        Schema::create('project_grids', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->string('axis', 1);
            $table->string('label');
            $table->integer('position');
            $table->timestamps();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });

        Schema::create('project_elements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->uuid('level_id')->nullable();
            $table->uuid('parent_id')->nullable();
            $table->string('type');
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('ifc_class')->nullable();
            $table->json('geometry')->nullable();
            $table->json('transform')->nullable();
            $table->json('properties')->nullable();
            $table->json('metadata')->nullable();
            $table->string('material_id')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['project_id', 'type']);
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });

        Schema::create('project_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->unsignedInteger('number');
            $table->string('label');
            $table->string('kind')->default('checkpoint');
            $table->json('document');
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });

        Schema::create('assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('training_class_id')->nullable();
            $table->uuid('challenge_id')->nullable();
            $table->string('title');
            $table->text('briefing')->nullable();
            $table->timestamp('deadline_at')->nullable();
            $table->json('rubric')->nullable();
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('project_id');
            $table->uuid('user_id');
            $table->uuid('assignment_id')->nullable();
            $table->uuid('project_version_id')->nullable();
            $table->string('status')->default('draft');
            $table->decimal('auto_score', 5, 2)->nullable();
            $table->decimal('trainer_score', 5, 2)->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->json('score_breakdown')->nullable();
            $table->text('trainer_comment')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('submission_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('submission_id');
            $table->uuid('project_version_id')->nullable();
            $table->unsignedInteger('revision_number')->default(1);
            $table->json('document')->nullable();
            $table->timestamps();
            $table->foreign('submission_id')->references('id')->on('submissions')->cascadeOnDelete();
        });

        Schema::create('issues', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('project_id');
            $table->uuid('submission_id')->nullable();
            $table->uuid('element_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('severity')->default('minor');
            $table->string('status')->default('open');
            $table->uuid('assigned_to')->nullable();
            $table->uuid('created_by');
            $table->json('camera_state')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('issue_comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('issue_id');
            $table->uuid('user_id');
            $table->text('body');
            $table->timestamps();
            $table->foreign('issue_id')->references('id')->on('issues')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('assessments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('submission_id');
            $table->uuid('user_id');
            $table->decimal('completion', 5, 2)->default(0);
            $table->decimal('accuracy', 5, 2)->default(0);
            $table->decimal('compliance', 5, 2)->default(0);
            $table->decimal('discipline', 5, 2)->default(0);
            $table->decimal('final_score', 5, 2)->default(0);
            $table->decimal('manual_adjustment', 5, 2)->default(0);
            $table->text('adjustment_reason')->nullable();
            $table->uuid('adjusted_by')->nullable();
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('submission_id')->references('id')->on('submissions')->cascadeOnDelete();
        });

        Schema::create('assessment_scores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('assessment_id');
            $table->string('component');
            $table->decimal('score', 5, 2);
            $table->decimal('weight', 4, 2);
            $table->timestamps();
            $table->foreign('assessment_id')->references('id')->on('assessments')->cascadeOnDelete();
        });

        Schema::create('competencies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('mvp_focus')->default(false);
            $table->timestamps();
        });

        Schema::create('user_competencies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('user_id');
            $table->uuid('competency_id');
            $table->decimal('score', 5, 2)->default(0);
            $table->string('level')->default('beginner');
            $table->timestamps();
            $table->unique(['user_id', 'competency_id', 'organization_id']);
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('competency_id')->references('id')->on('competencies')->cascadeOnDelete();
        });

        Schema::create('certificates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('user_id');
            $table->uuid('training_program_id');
            $table->string('certificate_number')->unique();
            $table->string('competency_level');
            $table->decimal('final_score', 5, 2);
            $table->date('issued_at');
            $table->string('verification_token')->unique();
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('training_program_id')->references('id')->on('training_programs')->cascadeOnDelete();
        });

        Schema::create('files', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('uploaded_by');
            $table->string('disk')->default('local');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            $table->string('purpose')->default('attachment');
            $table->nullableUuidMorphs('fileable');
            $table->timestamps();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->string('action');
            $table->string('auditable_type')->nullable();
            $table->uuid('auditable_id')->nullable();
            $table->json('payload')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
            $table->index(['organization_id', 'action']);
        });

        Schema::create('ifc_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('project_id');
            $table->string('type');
            $table->string('status')->default('queued');
            $table->json('result')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        $tables = [
            'ifc_jobs', 'audit_logs', 'files', 'certificates', 'user_competencies', 'competencies',
            'assessment_scores', 'assessments', 'issue_comments', 'issues', 'submission_versions',
            'submissions', 'assignments', 'project_versions', 'project_elements', 'project_grids',
            'project_levels', 'project_members', 'projects', 'project_materials', 'challenge_rules',
            'challenges', 'bim_lab_steps', 'bim_labs', 'quiz_attempts', 'quiz_questions', 'quizzes',
            'lesson_contents', 'lessons', 'modules', 'training_enrollments', 'training_classes',
            'training_programs', 'organization_users', 'permissions', 'roles',
        ];
        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['current_organization_id']);
        });
        Schema::dropIfExists('organizations');
    }
};
