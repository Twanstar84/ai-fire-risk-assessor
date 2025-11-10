import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { ArrowLeft, Send, Mic, Upload, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function AssessmentDetail() {
  const [match, params] = useRoute("/assessment/:id") as [boolean, Record<string, string> | undefined];
  const assessmentId = match && params?.id ? parseInt(params.id) : null;
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assessmentQuery = trpc.assessment.get.useQuery(
    { id: assessmentId! },
    { enabled: !!assessmentId && isAuthenticated }
  );

  const conversationQuery = trpc.conversation.history.useQuery(
    { assessmentId: assessmentId! },
    { enabled: !!assessmentId && isAuthenticated, refetchInterval: 1000 }
  );

  const findingsQuery = trpc.findings.list.useQuery(
    { assessmentId: assessmentId! },
    { enabled: !!assessmentId && isAuthenticated }
  );

  const imagesQuery = trpc.images.list.useQuery(
    { assessmentId: assessmentId! },
    { enabled: !!assessmentId && isAuthenticated }
  );

  const chatMutation = trpc.conversation.chat.useMutation({
    onSuccess: () => {
      setMessage("");
      conversationQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const generateReportMutation = trpc.report.generatePDF.useMutation({
    onSuccess: (data) => {
      if (data.htmlContent) {
        const blob = new Blob([data.htmlContent], { type: "text/html" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.fileName || "fire-risk-assessment.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Report downloaded successfully");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate report");
    },
  });

  // Only auto-scroll when NEW messages arrive, not on every render
  useEffect(() => {
    const currentMessageCount = conversationQuery.data?.length || 0;
    
    // Only scroll if messages actually changed
    if (currentMessageCount > lastMessageCountRef.current && messagesContainerRef.current) {
      lastMessageCountRef.current = currentMessageCount;
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [conversationQuery.data?.length]);

  const handleSendMessage = () => {
    if (!message.trim() || !assessmentId || chatMutation.isPending) return;
    chatMutation.mutate({
      assessmentId,
      message: message.trim(),
    });
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Speech recognition not supported in your browser");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      
      if (transcript.trim()) {
        setMessage(transcript);
      }
    };

    recognition.onerror = () => {
      toast.error("Error recording audio");
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assessmentId) return;

    if (file.size > 16 * 1024 * 1024) {
      toast.error("Image must be smaller than 16MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assessmentId", assessmentId.toString());

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast.success("Image uploaded successfully");
      imagesQuery.refetch();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  if (!assessmentId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Assessment not found</p>
      </div>
    );
  }

  if (assessmentQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading assessment...</p>
      </div>
    );
  }

  // Handle assessment not found or error
  if (assessmentQuery.isError || !assessmentQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-600">Assessment not found</p>
        <Button onClick={() => setLocation("/dashboard")}>Return to Dashboard</Button>
      </div>
    );
  }

  const assessment = assessmentQuery.data;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{assessment?.buildingName}</h1>
            <p className="text-sm text-slate-600">{assessment?.address}</p>
          </div>
          <Button
            onClick={() => assessmentId && generateReportMutation.mutate({ assessmentId })}
            disabled={generateReportMutation.isPending}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </div>

      {/* Main Content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chat Area */}
            <div className="lg:col-span-2">
              <Card className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle>Assessment Conversation</CardTitle>
                  <CardDescription>
                    Chat with the AI assistant to conduct the fire risk assessment
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                  {/* Messages Container - scrollable */}
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto border rounded-lg bg-slate-50 p-4 space-y-3"
                  >
                    {conversationQuery.data && conversationQuery.data.length > 0 ? (
                      <>
                        {conversationQuery.data.map((msg, idx) => (
                          <div
                            key={`msg-${idx}`}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`px-4 py-3 rounded-lg break-words ${
                                msg.role === "user"
                                  ? "bg-blue-500 text-white max-w-xs lg:max-w-md"
                                  : "bg-white text-slate-900 border border-slate-200 max-w-sm lg:max-w-md"
                              }`}
                            >
                              {msg.role === "assistant" ? (
                                <div className="text-sm prose prose-sm max-w-none">
                                  <Streamdown>{msg.content}</Streamdown>
                                </div>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {chatMutation.isPending && (
                          <div className="flex justify-start">
                            <div className="bg-white text-slate-900 border border-slate-200 px-4 py-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                                </div>
                                <span className="text-sm text-slate-600">AI is thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-slate-500 text-sm">
                          Start the assessment by sending a message
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Input Area - fixed at bottom */}
                  <div className="flex gap-2 shrink-0 pt-2 border-t">
                    <Input
                      placeholder="Type your message or use voice input..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={chatMutation.isPending || isRecording}
                      className="flex-1"
                      autoComplete="off"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleVoiceInput}
                      disabled={chatMutation.isPending || isRecording}
                      title="Voice input"
                      className={isRecording ? "bg-red-50" : ""}
                      type="button"
                    >
                      <Mic className={`w-4 h-4 ${isRecording ? "text-red-500" : ""}`} />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || chatMutation.isPending}
                      type="button"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assessment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assessment Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-600">Type</p>
                    <p className="font-medium">{assessment?.buildingType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Occupancy</p>
                    <p className="font-medium">{assessment?.occupancyType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Status</p>
                    <p className="font-medium capitalize">{assessment?.status}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Risk Level</p>
                    <p className={`font-medium ${
                      assessment?.riskLevel === "critical" ? "text-red-600" :
                      assessment?.riskLevel === "high" ? "text-orange-600" :
                      assessment?.riskLevel === "medium" ? "text-yellow-600" :
                      "text-green-600"
                    }`}>
                      {assessment?.riskLevel?.toUpperCase() || "Not assessed"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Findings Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Findings</CardTitle>
                </CardHeader>
                <CardContent>
                  {findingsQuery.isLoading ? (
                    <p className="text-sm text-slate-600">Loading...</p>
                  ) : findingsQuery.data && findingsQuery.data.length > 0 ? (
                    <div className="space-y-2">
                      {findingsQuery.data.slice(0, 5).map((finding, idx) => (
                        <div key={idx} className="text-xs border-l-2 border-orange-400 pl-2 py-1">
                          <p className="font-medium text-slate-900">{finding.title}</p>
                          <p className="text-slate-600 text-xs">{finding.category}</p>
                        </div>
                      ))}
                      {findingsQuery.data.length > 5 && (
                        <p className="text-xs text-slate-500 pt-2">
                          +{findingsQuery.data.length - 5} more findings
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No findings yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">Images</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? "Uploading..." : "Upload"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </CardHeader>
                <CardContent>
                  {imagesQuery.isLoading ? (
                    <p className="text-sm text-slate-600">Loading...</p>
                  ) : imagesQuery.data && imagesQuery.data.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {imagesQuery.data.slice(0, 4).map((img, idx) => (
                        <div key={idx} className="aspect-square bg-slate-100 rounded overflow-hidden">
                          <img
                            src={img.imageUrl}
                            alt="Assessment"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">No images uploaded</p>
                      <p className="text-xs text-slate-500 mt-1">Click Upload to add photos</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
