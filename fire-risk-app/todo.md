# Fire Risk Assessment Application - TODO

## Database & Schema (UK Regulatory Reform Fire Safety Order 2005)
- [x] Create assessment metadata table (building info, occupants, dates)
- [x] Create fire hazards section (electrical, smoking, arson, heaters, cooking, lightning)
- [x] Create fire protection measures section (detection, alarms, sprinklers, exits)
- [x] Create management section (procedures, training, maintenance)
- [x] Create findings/recommendations table
- [x] Create conversation history table
- [x] Create assessment images table
- [x] Push database migrations

## Backend API & LLM Integration
- [x] Implement LLM system prompt with fire safety standards knowledge
- [x] Create conversational assessment endpoint
- [ ] Implement voice transcription integration
- [ ] Create image analysis endpoint for hazard detection
- [ ] Build form auto-fill logic based on conversation
- [ ] Create findings generation from LLM analysis
- [ ] Implement document generation endpoint

## Frontend - Dashboard & Navigation
- [x] Design and implement dashboard layout
- [x] Create assessment list view
- [x] Build assessment creation flow
- [x] Implement navigation between assessment sections

## Frontend - Conversational Interface
- [x] Build chat component with message history
- [x] Implement voice input with transcription
- [x] Create audio recording interface
- [ ] Add streaming support for LLM responses
- [x] Implement markdown rendering for responses

## Frontend - Image & Document Handling
- [ ] Build image upload component
- [ ] Create image preview gallery
- [ ] Implement image analysis display
- [ ] Build document editor interface
- [ ] Create PDF export functionality

## Assessment Form Sections
- [ ] Part 1: General Information (building details, occupants)
- [ ] Part 2: Fire Hazards (electrical, smoking, arson, heaters, cooking, lightning, housekeeping)
- [ ] Part 3: Fire Protection Measures (detection, alarms, sprinklers, exits, signage)
- [ ] Part 4: Management of Fire Safety (procedures, training, maintenance)
- [ ] Part 5: Level of Risk (risk assessment matrix)
- [ ] Part 6: Significant Findings (findings and recommendations)

## Document Generation & Export
- [x] Implement PDF report generation for UK RRFSO 2005 format
- [x] Add 'Generate Report' button to assessment detail page
- [x] Create PDF export with all sections (findings, risk matrix, recommendations)
- [ ] Build document preview
- [ ] Add document editing capabilities
- [ ] Implement document signing/approval workflow

## Testing & Deployment
- [ ] Test full assessment workflow end-to-end
- [ ] Verify voice transcription accuracy
- [ ] Test image analysis functionality
- [ ] Verify document generation and export
- [ ] Test on multiple devices and browsers
- [ ] Performance optimization

## Technical Debt & Improvements
- [ ] Add comprehensive error logging
- [ ] Implement caching for standards data
- [ ] Add analytics tracking
- [ ] Create user documentation

## Bug Fixes & Issues
- [x] Fix overlapping chat bubbles in AssessmentDetail
- [x] CRITICAL: Fix chat mutation not sending messages or progressing conversation
- [x] Improve message scrolling and auto-scroll behavior
- [x] Add loading state indicators for LLM responses
- [x] CRITICAL: Page auto-scrolls back to top, preventing user scrolling
- [x] CRITICAL: Input field not responding to clicks or text input
- [x] CRITICAL: API returning HTML instead of JSON - "Unexpected token '<', '<!doctype'" errors on all queries (Fixed: missing useAuth import)

## Critical Issues to Fix
- [x] CRITICAL: Findings identified by AI in conversation are not being saved to database
- [ ] CRITICAL: Assessment info sidebar not updating with conversation data
- [x] CRITICAL: No image upload UI component - users cannot upload photos
- [x] Implement automatic findings extraction from AI responses
- [x] Add image upload button and S3 storage integration

## Error Handling Issues
- [x] Fix API returning HTML for non-existent assessments (should return proper 404 JSON error)
- [x] Add better error handling in AssessmentDetail for invalid assessment IDs
- [x] Redirect to dashboard when assessment not found
