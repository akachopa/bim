<?php

namespace Database\Seeders;

use App\Models\BimLab;
use App\Models\Certificate;
use App\Models\Challenge;
use App\Models\Competency;
use App\Models\Lesson;
use App\Models\LessonContent;
use App\Models\Module;
use App\Models\Organization;
use App\Models\Project;
use App\Models\ProjectMaterial;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\TrainingClass;
use App\Models\TrainingEnrollment;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\UserCompetency;
use App\Services\ProjectDocumentService;
use App\Support\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::query()->create([
            'name' => 'Akademi BIM Nusantara',
            'slug' => 'akademi-bim-nusantara',
            'code' => 'ABN',
            'plan' => 'professional',
            'settings' => ['timezone' => 'Asia/Jakarta'],
        ]);

        app(Tenant::class)->set($org->id);

        $super = User::query()->create([
            'name' => 'Super Admin',
            'email' => 'super@bim.test',
            'password' => Hash::make('password'),
            'is_super_admin' => true,
            'current_organization_id' => $org->id,
            'email_verified_at' => now(),
        ]);
        $admin = User::query()->create([
            'name' => 'Dewi Arsitek',
            'email' => 'admin@bim.test',
            'password' => Hash::make('password'),
            'current_organization_id' => $org->id,
            'email_verified_at' => now(),
        ]);
        $trainer = User::query()->create([
            'name' => 'Budi Coordinator',
            'email' => 'trainer@bim.test',
            'password' => Hash::make('password'),
            'current_organization_id' => $org->id,
            'email_verified_at' => now(),
        ]);
        $peserta = User::query()->create([
            'name' => 'Siti Modeler',
            'email' => 'peserta@bim.test',
            'password' => Hash::make('password'),
            'current_organization_id' => $org->id,
            'email_verified_at' => now(),
        ]);

        foreach ([
            [$super, 'org_admin'],
            [$admin, 'org_admin'],
            [$trainer, 'trainer'],
            [$peserta, 'participant'],
        ] as [$user, $role]) {
            $org->users()->attach($user->id, ['id' => (string) Str::uuid(), 'role' => $role]);
        }

        foreach ([
            ['BIM Fundamental', 'bim-fundamental', true],
            ['Architecture Modeling', 'architecture-modeling', true],
            ['Structure Modeling', 'structure-modeling', false],
            ['MEP Modeling', 'mep-modeling', false],
            ['BIM Coordination', 'bim-coordination', false],
            ['BIM Coordination Basic', 'bim-coordination-basic', true],
            ['Clash Detection', 'clash-detection', false],
            ['BIM Management', 'bim-management', false],
        ] as [$name, $slug, $mvp]) {
            Competency::query()->create([
                'name' => $name,
                'slug' => $slug,
                'description' => "Kompetensi {$name}",
                'mvp_focus' => $mvp,
            ]);
        }

        $program = TrainingProgram::query()->create([
            'organization_id' => $org->id,
            'title' => 'BIM Architecture Modeling Foundation',
            'code' => 'BIM-ARCH-FND',
            'description' => 'Program dasar modeling arsitektur BIM: level, grid, wall, bukaan, dan validasi model.',
            'status' => 'published',
            'duration_hours' => 40,
        ]);

        $class = TrainingClass::query()->create([
            'organization_id' => $org->id,
            'training_program_id' => $program->id,
            'name' => 'Batch Oktober 2026',
            'code' => 'ABN-OKT-26',
            'starts_at' => now()->subDays(7)->toDateString(),
            'ends_at' => now()->addDays(45)->toDateString(),
            'status' => 'active',
        ]);

        TrainingEnrollment::query()->create([
            'organization_id' => $org->id,
            'training_class_id' => $class->id,
            'user_id' => $peserta->id,
            'status' => 'active',
            'progress' => 35,
        ]);

        $m1 = Module::query()->create([
            'organization_id' => $org->id,
            'training_program_id' => $program->id,
            'title' => 'Dasar BIM & Koordinat',
            'sort_order' => 1,
            'description' => 'Konsep BIM, unit milimeter, dan storey.',
        ]);
        $m2 = Module::query()->create([
            'organization_id' => $org->id,
            'training_program_id' => $program->id,
            'title' => 'Modeling Arsitektur',
            'sort_order' => 2,
            'description' => 'Wall, door, window, slab.',
        ]);

        $l1 = Lesson::query()->create([
            'organization_id' => $org->id,
            'module_id' => $m1->id,
            'title' => 'Apa itu BIM?',
            'type' => 'article',
            'sort_order' => 1,
            'duration_minutes' => 20,
        ]);
        LessonContent::query()->create([
            'lesson_id' => $l1->id,
            'kind' => 'article',
            'title' => 'Pengantar',
            'body' => "BIM (Building Information Modeling) menempatkan data semantik sebagai sumber kebenaran. Geometry hanya turunan dari objek BIM: wall memiliki start/end, ketebalan, tinggi, material, dan klasifikasi IFC.\n\nDi platform ini Anda belajar modeling training-first: cukup kuat untuk latihan dan simulasi proyek, tanpa menjadi klon Revit.",
            'sort_order' => 1,
        ]);

        $l2 = Lesson::query()->create([
            'organization_id' => $org->id,
            'module_id' => $m1->id,
            'title' => 'Level, Grid, dan Snap',
            'type' => 'article',
            'sort_order' => 2,
            'duration_minutes' => 25,
        ]);
        LessonContent::query()->create([
            'lesson_id' => $l2->id,
            'kind' => 'article',
            'title' => 'Kerangka ruang',
            'body' => "Setiap model dimulai dari Level (IfcBuildingStorey) dan Grid. Snap mengikuti prioritas: intersection, endpoint, midpoint, grid, orthogonal, lalu free. Unit internal selalu milimeter: 1 m = 1000.",
            'sort_order' => 1,
        ]);

        $l3 = Lesson::query()->create([
            'organization_id' => $org->id,
            'module_id' => $m2->id,
            'title' => 'Membuat Wall',
            'type' => 'lab',
            'sort_order' => 1,
            'duration_minutes' => 40,
        ]);

        $lab = BimLab::query()->create([
            'organization_id' => $org->id,
            'training_program_id' => $program->id,
            'title' => 'Lab: Menggambar Dinding 5000 mm',
            'description' => 'Praktik guided: buat level, grid, lalu wall sepanjang 5000 mm dengan ketebalan 150 mm.',
            'project_template' => $this->labTemplate(),
        ]);

        foreach ([
            [1, 'Aktifkan tool Wall', 'Pilih tool Wall (W) pada toolbar kiri.', 'activate_wall', ['type' => 'REQUIRED_ELEMENT', 'elementType' => 'wall'], 'Tekan tombol W atau ikon Wall.'],
            [2, 'Gambar wall 5000 mm', 'Klik titik awal, tarik orthogonal, lepas pada panjang 5000 mm.', 'draw_wall_5000', ['type' => 'MIN_ELEMENT_COUNT', 'elementType' => 'wall', 'min' => 1], 'Gunakan snap grid 1000 mm. Panjang tampil di preview.'],
            [3, 'Set ketebalan 150 mm', 'Ubah thickness wall menjadi 150 mm di panel Properties.', 'set_thickness_150', ['type' => 'DIMENSION_RANGE'], 'Pilih wall, lalu edit Thickness.'],
            [4, 'Set tinggi 3000 mm', 'Pastikan height 3000 mm dan material Concrete atau Brick.', 'set_height_3000', ['type' => 'REQUIRED_MATERIAL'], 'Gunakan tab Material di panel kanan.'],
        ] as [$order, $title, $instruction, $action, $rule, $hint]) {
            $lab->steps()->create([
                'title' => $title,
                'instruction' => $instruction,
                'required_action' => $action,
                'validation_rule' => $rule,
                'hint' => $hint,
                'sort_order' => $order,
            ]);
        }

        LessonContent::query()->create([
            'lesson_id' => $l3->id,
            'kind' => 'lab',
            'title' => 'Praktikkan Sekarang',
            'body' => "1. Klik Grid A1\n2. Tarik ke Grid A4\n3. Set thickness 150 mm\n4. Set height 3000 mm",
            'lab_id' => $lab->id,
            'sort_order' => 1,
        ]);

        $quiz = Quiz::query()->create([
            'organization_id' => $org->id,
            'lesson_id' => $l1->id,
            'title' => 'Kuis Dasar BIM',
            'passing_score' => 70,
        ]);
        foreach ([
            ['Apa sumber kebenaran model di platform ini?', ['Mesh Babylon.js', 'Dokumen BIM semantik', 'File RVT', 'Screenshot 3D'], 1],
            ['1 meter setara dengan berapa unit internal?', ['1', '100', '1000', '10000'], 2],
            ['Door dan window wajib menjadi child dari?', ['Slab', 'Grid', 'Wall', 'Level saja'], 2],
        ] as $i => [$prompt, $options, $correct]) {
            QuizQuestion::query()->create([
                'quiz_id' => $quiz->id,
                'prompt' => $prompt,
                'options' => $options,
                'correct_index' => $correct,
                'sort_order' => $i + 1,
            ]);
        }

        $challenge = Challenge::query()->create([
            'organization_id' => $org->id,
            'title' => 'Model Rumah 2 Lantai',
            'description' => 'Simulasikan rumah sederhana 2 lantai: 12 wall, 4 column, 4 beam, 1 slab, 3 door, 6 window. Durasi 120 menit. Passing score 75.',
            'difficulty' => 'intermediate',
            'duration_minutes' => 120,
            'maximum_score' => 100,
            'passing_score' => 75,
            'project_template' => $this->challengeTemplate(),
        ]);

        $rules = [
            ['req-level', '2 Level', 'REQUIRED_LEVEL', ['min' => 2], 15],
            ['min-wall', '12 Wall', 'MIN_ELEMENT_COUNT', ['elementType' => 'wall', 'min' => 12], 20],
            ['min-col', '4 Column', 'MIN_ELEMENT_COUNT', ['elementType' => 'column', 'min' => 4], 10],
            ['min-beam', '4 Beam', 'MIN_ELEMENT_COUNT', ['elementType' => 'beam', 'min' => 4], 10],
            ['min-slab', '1 Slab', 'MIN_ELEMENT_COUNT', ['elementType' => 'slab', 'min' => 1], 10],
            ['min-door', '3 Door', 'MIN_ELEMENT_COUNT', ['elementType' => 'door', 'min' => 3], 10],
            ['min-win', '6 Window', 'MIN_ELEMENT_COUNT', ['elementType' => 'window', 'min' => 6], 10],
            ['host', 'Host door/window', 'HOST_REQUIRED', [], 10],
            ['mat', 'Material wajib', 'REQUIRED_MATERIAL', [], 5],
        ];
        foreach ($rules as [$id, $name, $type, $config, $weight]) {
            $challenge->rules()->create([
                'rule_id' => $id,
                'name' => $name,
                'type' => $type,
                'config' => $config,
                'weight' => $weight,
            ]);
        }

        $docs = app(ProjectDocumentService::class);
        foreach ($docs->defaultMaterials() as $material) {
            ProjectMaterial::query()->create([
                ...$material,
                'organization_id' => $org->id,
                'is_global' => true,
            ]);
        }

        $project = Project::query()->create([
            'organization_id' => $org->id,
            'owner_id' => $peserta->id,
            'training_program_id' => $program->id,
            'title' => 'Studio Latihan — Rumah Tinggal',
            'code' => 'PRJ-DEMO1',
            'description' => 'Proyek latihan peserta untuk BIM Studio.',
            'status' => 'draft',
            'unit' => 'millimeter',
            'schema_version' => '1.0.0',
        ]);
        $docs->saveDocument($project, $docs->emptyDocument($project), $peserta, true, 'v1 Initial');

        foreach (Competency::query()->where('mvp_focus', true)->get() as $competency) {
            UserCompetency::query()->create([
                'organization_id' => $org->id,
                'user_id' => $peserta->id,
                'competency_id' => $competency->id,
                'score' => 42,
                'level' => 'beginner',
            ]);
        }

        Certificate::query()->create([
            'organization_id' => $org->id,
            'user_id' => $peserta->id,
            'training_program_id' => $program->id,
            'certificate_number' => 'BIM-ABN-2026-0001',
            'competency_level' => 'Foundation',
            'final_score' => 78,
            'issued_at' => now()->toDateString(),
            'verification_token' => 'demo-verify-token',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function labTemplate(): array
    {
        $l1 = (string) Str::uuid();

        return [
            'schemaVersion' => '1.0.0',
            'project' => ['title' => 'Lab Wall', 'code' => 'LAB-WALL', 'unit' => 'millimeter'],
            'levels' => [['id' => $l1, 'name' => 'Level 1', 'elevation' => 0, 'order' => 0]],
            'grids' => $this->defaultGrids(),
            'elements' => [],
            'materials' => app(ProjectDocumentService::class)->defaultMaterials(),
            'settings' => ['gridSize' => 1000, 'snapEnabled' => true, 'activeLevelId' => $l1, 'activeTool' => 'wall'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function challengeTemplate(): array
    {
        $l1 = (string) Str::uuid();
        $l2 = (string) Str::uuid();

        return [
            'schemaVersion' => '1.0.0',
            'project' => ['title' => 'Rumah 2 Lantai', 'code' => 'CH-HOUSE', 'unit' => 'millimeter'],
            'levels' => [
                ['id' => $l1, 'name' => 'Level 1', 'elevation' => 0, 'order' => 0],
                ['id' => $l2, 'name' => 'Level 2', 'elevation' => 3000, 'order' => 1],
            ],
            'grids' => $this->defaultGrids(),
            'elements' => [],
            'materials' => app(ProjectDocumentService::class)->defaultMaterials(),
            'settings' => ['gridSize' => 1000, 'snapEnabled' => true, 'activeLevelId' => $l1],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function defaultGrids(): array
    {
        $grids = [];
        foreach (['A', 'B', 'C', 'D'] as $i => $label) {
            $grids[] = ['id' => (string) Str::uuid(), 'axis' => 'Y', 'label' => $label, 'position' => $i * 4000];
        }
        foreach (['1', '2', '3', '4'] as $i => $label) {
            $grids[] = ['id' => (string) Str::uuid(), 'axis' => 'X', 'label' => $label, 'position' => $i * 4000];
        }

        return $grids;
    }
}
