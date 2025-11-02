import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Star, Trash2, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Preset, Category, GeneratorType } from "@shared/schema";

interface PresetManagerProps {
  currentCategory: Category;
  currentType: GeneratorType;
  currentInputs: any;
  onLoadPreset: (preset: Preset) => void;
}

export function PresetManager({ 
  currentCategory, 
  currentType, 
  currentInputs, 
  onLoadPreset 
}: PresetManagerProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [deletePresetId, setDeletePresetId] = useState<number | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const { data: presetsData, isLoading } = useQuery<{ presets: Preset[] }>({
    queryKey: ["/api/presets"],
    enabled: isAuthenticated,
  });

  const presets = presetsData?.presets || [];

  const savePresetMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/presets", {
        name: presetName,
        description: presetDescription,
        category: currentCategory,
        genType: currentType,
        inputs: currentInputs,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      setSaveDialogOpen(false);
      setPresetName("");
      setPresetDescription("");
      toast({
        title: "Preset saved",
        description: "Your preset has been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save preset",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (presetId: number) => {
      return apiRequest("PATCH", `/api/presets/${presetId}/favorite`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: async (presetId: number) => {
      return apiRequest("DELETE", `/api/presets/${presetId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      setDeletePresetId(null);
      toast({
        title: "Preset deleted",
        description: "Your preset has been deleted",
      });
    },
  });

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your preset",
        variant: "destructive",
      });
      return;
    }
    savePresetMutation.mutate();
  };

  const filteredPresets = presets.filter(
    (preset) => preset.category === currentCategory && preset.genType === currentType
  );

  const favoritePresets = filteredPresets.filter((p) => p.isFavorite);
  const otherPresets = filteredPresets.filter((p) => !p.isFavorite);

  // Don't show presets section at all if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle>Presets</CardTitle>
              <CardDescription>Save and load your configurations</CardDescription>
            </div>
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-save-preset">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Preset</DialogTitle>
                  <DialogDescription>
                    Save your current configuration as a preset
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preset-name">Name</Label>
                    <Input
                      id="preset-name"
                      placeholder="My preset name"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      data-testid="input-preset-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preset-description">Description (optional)</Label>
                    <Input
                      id="preset-description"
                      placeholder="Describe this preset..."
                      value={presetDescription}
                      onChange={(e) => setPresetDescription(e.target.value)}
                      data-testid="input-preset-description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSavePreset}
                    disabled={savePresetMutation.isPending}
                    data-testid="button-confirm-save-preset"
                  >
                    {savePresetMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Preset
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPresets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No presets saved yet for this generator
            </p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {favoritePresets.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Favorites</p>
                    {favoritePresets.map((preset) => (
                      <PresetItem
                        key={preset.id}
                        preset={preset}
                        onLoad={onLoadPreset}
                        onToggleFavorite={toggleFavoriteMutation.mutate}
                        onDelete={(id) => setDeletePresetId(id)}
                      />
                    ))}
                  </div>
                )}
                {otherPresets.length > 0 && (
                  <div className="space-y-2">
                    {favoritePresets.length > 0 && (
                      <p className="text-xs font-medium text-muted-foreground pt-2">Other</p>
                    )}
                    {otherPresets.map((preset) => (
                      <PresetItem
                        key={preset.id}
                        preset={preset}
                        onLoad={onLoadPreset}
                        onToggleFavorite={toggleFavoriteMutation.mutate}
                        onDelete={(id) => setDeletePresetId(id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deletePresetId !== null} onOpenChange={() => setDeletePresetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete preset?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This preset will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePresetId && deletePresetMutation.mutate(deletePresetId)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface PresetItemProps {
  preset: Preset;
  onLoad: (preset: Preset) => void;
  onToggleFavorite: (id: number) => void;
  onDelete: (id: number) => void;
}

function PresetItem({ preset, onLoad, onToggleFavorite, onDelete }: PresetItemProps) {
  return (
    <div
      className="flex items-center justify-between gap-2 p-3 rounded-md border bg-card hover-elevate active-elevate-2 cursor-pointer"
      onClick={() => onLoad(preset)}
      data-testid={`preset-${preset.id}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{preset.name}</p>
        {preset.description && (
          <p className="text-xs text-muted-foreground truncate">{preset.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(preset.id);
          }}
          data-testid={`button-favorite-${preset.id}`}
        >
          <Star
            className={`h-4 w-4 ${preset.isFavorite ? "fill-primary text-primary" : ""}`}
          />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(preset.id);
          }}
          data-testid={`button-delete-${preset.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
