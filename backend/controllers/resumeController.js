// Resume Controller
// Handles PDF upload, parsing via Resume Agent, and embedding storage.
// Flow: PDF → extract text → Resume Agent → structured JSON → generate embedding → save to DB

const pdf = require("pdf-parse");
const supabase = require("../utils/supabase");
const { parseResume, extractSkills } = require("../services/resumeAgent");
const { generateEmbedding } = require("../utils/embeddings");

async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    // Extract raw text from PDF buffer (no disk write needed)
    const pdfData = await pdf(req.file.buffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length < 50) {
      return res.status(400).json({ error: "Could not extract text from PDF" });
    }

    // Upload PDF to Supabase Storage
    const fileName = `${req.user.id}-${Date.now()}.pdf`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from("resumes")
      .upload(fileName, req.file.buffer, { contentType: "application/pdf" });

    if (storageError) throw storageError;

    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(fileName);

    // AI Agent: parse resume into structured data
    const parsedData = await parseResume(rawText);

    // AI Agent: extract just the skills array
    const extractedSkills = await extractSkills(rawText);

    // Generate embedding vector from raw text for semantic search
    const embedding = await generateEmbedding(rawText);

    // Save everything to the database
    const { data: resume, error: dbError } = await supabase
      .from("resumes")
      .insert({
        candidate_id: req.user.id,
        file_url: urlData.publicUrl,
        raw_text: rawText,
        parsed_data: parsedData,
        extracted_skills: extractedSkills,
        embedding,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    res.status(201).json({
      message: "Resume uploaded and parsed successfully",
      resume: {
        id: resume.id,
        parsed_data: resume.parsed_data,
        extracted_skills: resume.extracted_skills,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getMyResume(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("resumes")
      .select("id, file_url, parsed_data, extracted_skills, created_at")
      .eq("candidate_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) return res.status(404).json({ error: "No resume found" });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadResume, getMyResume };
