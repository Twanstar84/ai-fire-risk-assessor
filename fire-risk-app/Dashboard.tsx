import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, FileText, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    buildingName: "",
    buildingType: "commercial",
    address: "",
    occupancyType: "office",
  });

  const assessmentsQuery = trpc.assessment.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.assessment.create.useMutation({
    onSuccess: () => {
      toast.success("Assessment created successfully");
      setFormData({ buildingName: "", buildingType: "commercial", address: "", occupancyType: "office" });
      setOpen(false);
      assessmentsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create assessment");
    },
  });

  const handleCreate = () => {
    if (!formData.buildingName.trim()) {
      toast.error("Building name is required");
      return;
    }
    createMutation.mutate(formData);
  };

  const getRiskColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "in_progress":
        return "bg-blue-50 border-blue-200";
      case "draft":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      archived: "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Fire Risk Assessments</h1>
          <p className="text-slate-600">Manage and conduct fire safety assessments with AI assistance</p>
        </div>

        {/* Create Assessment Button */}
        <div className="mb-8">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                New Assessment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Assessment</DialogTitle>
                <DialogDescription>
                  Start a new fire risk assessment for a building
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="buildingName">Building Name *</Label>
                  <Input
                    id="buildingName"
                    placeholder="e.g., 1 Hercules Street"
                    value={formData.buildingName}
                    onChange={(e) =>
                      setFormData({ ...formData, buildingName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Full address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="buildingType">Building Type</Label>
                  <Select
                    value={formData.buildingType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, buildingType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="mixed">Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="occupancyType">Occupancy Type</Label>
                  <Select
                    value={formData.occupancyType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, occupancyType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Creating..." : "Create Assessment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessmentsQuery.isLoading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-600">Loading assessments...</p>
            </div>
          ) : assessmentsQuery.data && assessmentsQuery.data.length > 0 ? (
            assessmentsQuery.data.map((assessment) => (
              <Link key={assessment.id} href={`/assessment/${assessment.id}`}>
                <Card className={`cursor-pointer hover:shadow-lg transition-shadow border ${getRiskColor(assessment.status)}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{assessment.buildingName}</CardTitle>
                        <CardDescription>{assessment.address}</CardDescription>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusBadge(assessment.status)}`}>
                        {assessment.status.replace("_", " ")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <FileText className="w-4 h-4" />
                        <span>{assessment.buildingType || "Unknown type"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(assessment.assessmentDate).toLocaleDateString()}</span>
                      </div>
                      {assessment.riskLevel && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span className={`font-semibold ${
                            assessment.riskLevel === "critical" ? "text-red-600" :
                            assessment.riskLevel === "high" ? "text-orange-600" :
                            assessment.riskLevel === "medium" ? "text-yellow-600" :
                            "text-green-600"
                          }`}>
                            {assessment.riskLevel.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No assessments yet</p>
              <p className="text-sm text-slate-500">Create your first fire risk assessment to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
