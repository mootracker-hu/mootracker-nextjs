-- Create Pens table (Fizikai karamok)
CREATE TABLE pens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pen_number TEXT UNIQUE NOT NULL, -- "K1", "K2", "E1", etc.
  pen_type TEXT CHECK (pen_type IN ('outdoor', 'barn', 'birthing')) NOT NULL,
  capacity INTEGER NOT NULL, -- fix kapacitás
  location TEXT, -- "Északi sor, bal oldal"
  gps_coordinates JSONB, -- {lat, lng}
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Pen Functions table (Dinamikus funkciók)
CREATE TABLE pen_functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pen_id UUID REFERENCES pens(id) ON DELETE CASCADE,
  function_type TEXT CHECK (function_type IN ('bölcsi', 'óvi', 'hárem', 'vemhes', 'hízóbika', 'ellető', 'üres')) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NULL, -- NULL = aktív funkció
  metadata JSONB DEFAULT '{}', -- típus-specifikus adatok
  notes TEXT,
  created_by TEXT, -- user email vagy név
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Animal Pen Assignments table (Állat-karám kapcsolatok)
CREATE TABLE animal_pen_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
  pen_id UUID REFERENCES pens(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_at TIMESTAMP WITH TIME ZONE NULL, -- NULL = még itt van
  assignment_reason TEXT, -- "age_separation", "breeding", "birthing"
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Animal Movements table (Mozgatási történet)
CREATE TABLE animal_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
  from_pen_id UUID REFERENCES pens(id),
  to_pen_id UUID REFERENCES pens(id),
  moved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  movement_reason TEXT,
  moved_by TEXT, -- user email vagy név
  batch_id UUID, -- több állat egy batch-ben
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_pen_functions_pen_id ON pen_functions(pen_id);
CREATE INDEX idx_pen_functions_active ON pen_functions(pen_id) WHERE end_date IS NULL;
CREATE INDEX idx_animal_assignments_animal ON animal_pen_assignments(animal_id);
CREATE INDEX idx_animal_assignments_pen ON animal_pen_assignments(pen_id);
CREATE INDEX idx_animal_assignments_active ON animal_pen_assignments(animal_id) WHERE removed_at IS NULL;
CREATE INDEX idx_animal_movements_animal ON animal_movements(animal_id);
CREATE INDEX idx_animal_movements_batch ON animal_movements(batch_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE pens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pen_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_pen_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_movements ENABLE ROW LEVEL SECURITY;

-- Create basic policies (adjust based on your auth setup)
CREATE POLICY "Allow all operations on pens" ON pens FOR ALL USING (true);
CREATE POLICY "Allow all operations on pen_functions" ON pen_functions FOR ALL USING (true);
CREATE POLICY "Allow all operations on animal_pen_assignments" ON animal_pen_assignments FOR ALL USING (true);
CREATE POLICY "Allow all operations on animal_movements" ON animal_movements FOR ALL USING (true);