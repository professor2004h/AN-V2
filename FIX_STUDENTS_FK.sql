-- Add missing FK for batch_id in students table
ALTER TABLE students 
ADD CONSTRAINT students_batch_id_fkey 
FOREIGN KEY (batch_id) 
REFERENCES batches(id);
