import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Plus, 
  Trash2, 
  Paperclip, 
  Download, 
  FileText, 
  Table, 
  Bot, 
  User,
  Loader2,
  MessageSquare,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  attachments?: Array<{filename: string; originalName: string; filePath: string; fileType: string}>;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  llmProvider: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export default function AIAgentPage() {
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("gemini");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/ai/conversations"],
  });

  const { data: currentConversation, isLoading: loadingMessages } = useQuery<Conversation>({
    queryKey: ["/api/ai/conversations", selectedConversationId],
    queryFn: async () => {
      const res = await fetch(`/api/ai/conversations/${selectedConversationId}`);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return res.json();
    },
    enabled: !!selectedConversationId,
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/conversations", { llmProvider: selectedProvider });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      setSelectedConversationId(data.id);
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create conversation", variant: "destructive" });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ai/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      if (selectedConversationId) {
        setSelectedConversationId(null);
      }
      toast({ title: "Conversation deleted" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, files }: { conversationId: number; content: string; files: File[] }) => {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("provider", selectedProvider);
      files.forEach((file) => formData.append("files", file));

      const res = await fetch(`/api/ai/conversations/${conversationId}/messages`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      setMessageInput("");
      setSelectedFiles([]);
    },
    onError: (error: any) => {
      const message = error.message || "Failed to send message";
      toast({ 
        title: "Error", 
        description: message.includes("Rate limit") 
          ? "The AI is currently busy. Please wait a moment and try again." 
          : "Failed to send message", 
        variant: "destructive" 
      });
    },
  });

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: messageInput,
      files: selectedFiles,
    });
  };

  const handleNewConversation = () => {
    createConversationMutation.mutate();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleExport = async (format: "text" | "csv") => {
    if (!selectedConversationId) return;
    window.open(`/api/ai/conversations/${selectedConversationId}/export?format=${format}`, "_blank");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages]);

  const formatMessage = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-4">{line.substring(2)}</li>;
      }
      if (line.startsWith('# ')) {
        return <h3 key={i} className="font-bold text-lg mt-2">{line.substring(2)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h4 key={i} className="font-semibold mt-2">{line.substring(3)}</h4>;
      }
      if (line.match(/^\|.*\|$/)) {
        const cells = line.split('|').filter(c => c.trim());
        return (
          <div key={i} className="flex border-b border-slate-200">
            {cells.map((cell, j) => (
              <div key={j} className="px-2 py-1 flex-1 text-sm">{cell.trim()}</div>
            ))}
          </div>
        );
      }
      return <p key={i} className="mb-1">{line}</p>;
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <Button 
            onClick={handleNewConversation} 
            className="w-full bg-[#2AA448] hover:bg-[#248f3d]"
            disabled={createConversationMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        <div className="p-4 border-b border-slate-200">
          <label className="text-xs text-slate-500 mb-2 block">LLM Provider</label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">Gemini 2.0 Flash</SelectItem>
              <SelectItem value="openai" disabled>OpenAI (Coming Soon)</SelectItem>
              <SelectItem value="claude" disabled>Claude (Coming Soon)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loadingConversations ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-slate-400 text-center p-4">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg cursor-pointer mb-1 group",
                  selectedConversationId === conv.id
                    ? "bg-[#2AA448] text-white"
                    : "hover:bg-slate-100"
                )}
                onClick={() => setSelectedConversationId(conv.id)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-sm truncate">{conv.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "opacity-0 group-hover:opacity-100 h-6 w-6 p-0",
                    selectedConversationId === conv.id ? "hover:bg-white/20" : "hover:bg-slate-200"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversationMutation.mutate(conv.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {!selectedConversationId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="h-16 w-16 mx-auto text-[#2AA448] mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">AI Agent</h2>
              <p className="text-slate-500 mb-4">
                Ask questions about your suppliers, products, invoices, and more
              </p>
              <Button onClick={handleNewConversation} className="bg-[#2AA448] hover:bg-[#248f3d]">
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h2 className="font-semibold text-slate-700">
                  {currentConversation?.title || (loadingMessages ? "Loading..." : "New Conversation")}
                </h2>
                <p className="text-xs text-slate-400">
                  Provider: {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("text")}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Export Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("csv")}
                >
                  <Table className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : currentConversation?.messages?.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <Bot className="h-12 w-12 mx-auto mb-2 text-[#2AA448]" />
                  <p>Start chatting with the AI Agent</p>
                  <p className="text-sm mt-1">Ask about suppliers, products, invoices, or upload files for analysis</p>
                </div>
              ) : (
                currentConversation?.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-[#2AA448] flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg p-3",
                        msg.role === "user"
                          ? "bg-[#2AA448] text-white"
                          : "bg-slate-100 text-slate-800"
                      )}
                    >
                      <div className="whitespace-pre-wrap text-sm">
                        {formatMessage(msg.content)}
                      </div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/20">
                          {msg.attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs opacity-80">
                              <Paperclip className="h-3 w-3" />
                              {att.originalName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {sendMessageMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-[#2AA448] flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-slate-100 rounded-lg p-3">
                    <Loader2 className="h-5 w-5 animate-spin text-[#2AA448]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200">
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 bg-slate-100 rounded px-2 py-1 text-sm"
                    >
                      <Paperclip className="h-3 w-3" />
                      {file.name}
                      <button
                        onClick={() => setSelectedFiles(files => files.filter((_, j) => j !== i))}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept=".csv,.pdf,.xlsx,.xls,.txt"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Ask about suppliers, products, invoices, or upload files for analysis..."
                  className="flex-1 min-h-[44px] max-h-32 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  className="bg-[#2AA448] hover:bg-[#248f3d]"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
