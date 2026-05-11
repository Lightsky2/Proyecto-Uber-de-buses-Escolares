
/*
  # Viaje Seguro - Initial Schema

  ## Summary
  Creates the full data model for the school transport management platform.

  ## New Tables

  ### profiles
  Links Supabase auth users to roles and display names.
  - id (uuid, PK, references auth.users)
  - role: 'admin' | 'chofer' | 'apoderado'
  - nombre (text)
  - contacto (text)

  ### furgones
  School transport vans managed by admins.
  - id, nombre_furgon, patente, capacidad
  - chofer_id (FK -> profiles, nullable)

  ### estudiantes
  Students linked to a guardian (apoderado) and a van (furgon).
  - id, nombre, colegio, direccion
  - apoderado_id (FK -> profiles)
  - furgon_id (FK -> furgones, nullable)

  ### estados
  Status events for each student's trip.
  - id, estudiante_id (FK), estado (enum), fecha_hora

  ## Security
  - RLS enabled on all tables
  - Admins can read/write everything
  - Choferes can read students assigned to their van, insert/update estados
  - Apoderados can read their own students and estados
*/

-- -------------------------
-- profiles
-- -------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'chofer', 'apoderado')),
  nombre text NOT NULL DEFAULT '',
  contacto text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- -------------------------
-- furgones
-- -------------------------
CREATE TABLE IF NOT EXISTS furgones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_furgon text NOT NULL DEFAULT '',
  patente text NOT NULL DEFAULT '',
  capacidad integer NOT NULL DEFAULT 0,
  chofer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE furgones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read furgones"
  ON furgones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert furgones"
  ON furgones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update furgones"
  ON furgones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can delete furgones"
  ON furgones FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- -------------------------
-- estudiantes
-- -------------------------
CREATE TABLE IF NOT EXISTS estudiantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL DEFAULT '',
  colegio text NOT NULL DEFAULT '',
  direccion text NOT NULL DEFAULT '',
  apoderado_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  furgon_id uuid REFERENCES furgones(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all estudiantes"
  ON estudiantes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Apoderados can read own estudiantes"
  ON estudiantes FOR SELECT
  TO authenticated
  USING (apoderado_id = auth.uid());

CREATE POLICY "Choferes can read students in their furgon"
  ON estudiantes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM furgones f
      WHERE f.id = estudiantes.furgon_id
      AND f.chofer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert estudiantes"
  ON estudiantes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update estudiantes"
  ON estudiantes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can delete estudiantes"
  ON estudiantes FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- -------------------------
-- estados
-- -------------------------
CREATE TABLE IF NOT EXISTS estados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id uuid NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  estado text NOT NULL CHECK (estado IN ('en_ruta', 'en_escuela', 'retirado', 'esperando')),
  fecha_hora timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE estados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all estados"
  ON estados FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Apoderados can read estados of own students"
  ON estados FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM estudiantes e
      WHERE e.id = estados.estudiante_id
      AND e.apoderado_id = auth.uid()
    )
  );

CREATE POLICY "Choferes can read estados of students in their furgon"
  ON estados FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM estudiantes e
      JOIN furgones f ON f.id = e.furgon_id
      WHERE e.id = estados.estudiante_id
      AND f.chofer_id = auth.uid()
    )
  );

CREATE POLICY "Choferes can insert estados for their students"
  ON estados FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM estudiantes e
      JOIN furgones f ON f.id = e.furgon_id
      WHERE e.id = estados.estudiante_id
      AND f.chofer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert estados"
  ON estados FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_estudiantes_apoderado ON estudiantes(apoderado_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_furgon ON estudiantes(furgon_id);
CREATE INDEX IF NOT EXISTS idx_estados_estudiante ON estados(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_estados_fecha ON estados(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_furgones_chofer ON furgones(chofer_id);
