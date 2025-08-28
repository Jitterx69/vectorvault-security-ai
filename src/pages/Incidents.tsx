import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  Clock, 
  Filter, 
  Plus, 
  Search,
  Eye,
  RefreshCw,
  Download,
  TrendingUp,
  Users,
  Shield
} from "lucide-react";

const Incidents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const incidents = [
    {
      id: "INC-2024-001",
      title: "DDoS Attack on Web Infrastructure", 
      severity: "Critical",
      status: "Active",
      assignee: "SOC Team Alpha",
      created: "2024-01-15 14:30",
      updated: "2 mins ago",
      description: "Large-scale distributed denial-of-service attack detected on primary web servers",
      tags: ["ddos", "web", "high-volume"]
    },
    {
      id: "INC-2024-002",
      title: "Suspicious Login Patterns",
      severity: "High", 
      status: "Investigating",
      assignee: "Jane Smith",
      created: "2024-01-15 13:45",
      updated: "15 mins ago",
      description: "Multiple failed login attempts from various geographic locations",
      tags: ["auth", "brute-force", "geo-anomaly"]
    },
    {
      id: "INC-2024-003", 
      title: "Malware Detection in Email System",
      severity: "Medium",
      status: "Contained",
      assignee: "Mike Johnson",
      created: "2024-01-15 12:20",
      updated: "1 hour ago",
      description: "Malicious attachment detected and quarantined in email gateway",
      tags: ["malware", "email", "quarantined"]
    },
    {
      id: "INC-2024-004",
      title: "Unauthorized Database Access Attempt",
      severity: "High",
      status: "Resolved",
      assignee: "Security Team Beta", 
      created: "2024-01-15 09:15",
      updated: "3 hours ago",
      description: "Failed attempt to access customer database from unknown IP",
      tags: ["database", "unauthorized", "blocked"]
    },
    {
      id: "INC-2024-005",
      title: "SSL Certificate Expiration Alert",
      severity: "Low",
      status: "Scheduled",
      assignee: "IT Operations",
      created: "2024-01-15 08:00", 
      updated: "4 hours ago",
      description: "SSL certificate for api.company.com expires in 7 days",
      tags: ["ssl", "certificate", "maintenance"]
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'Critical': return 'status-critical pulse-danger';
      case 'High': return 'status-warning';
      case 'Medium': return 'status-info';
      case 'Low': return 'status-success';
      default: return 'status-info';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Active': return 'bg-danger/20 text-danger border-danger/30';
      case 'Investigating': return 'bg-warning/20 text-warning border-warning/30';
      case 'Contained': return 'bg-primary/20 text-primary border-primary/30';
      case 'Resolved': return 'bg-success/20 text-success border-success/30';
      case 'Scheduled': return 'bg-muted/20 text-muted-foreground border-muted/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Security Incidents
          </h1>
          <p className="text-muted-foreground">Incident management and response coordination</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="glow-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Incident
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Incidents</p>
                <p className="text-2xl font-bold text-danger">3</p>
              </div>
              <div className="p-2 bg-danger/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-danger" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold text-primary">4.2m</p>
              </div>
              <div className="p-2 bg-primary/20 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold text-success">94%</p>
              </div>
              <div className="p-2 bg-success/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="p-2 bg-muted/20 rounded-lg">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="card-gradient border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input/50 border-border/50"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <div className="space-y-4">
        {incidents.map((incident) => (
          <Card key={incident.id} className="card-gradient border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{incident.title}</h3>
                    <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(incident.status)}>
                      {incident.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {incident.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>ID: {incident.id}</span>
                  <span>Assignee: {incident.assignee}</span>
                  <span>Created: {incident.created}</span>
                  <span>Updated: {incident.updated}</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button size="sm" className="glow-primary">
                    <Shield className="h-4 w-4 mr-2" />
                    Investigate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Incidents;