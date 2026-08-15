import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FlowNode } from "@/lib/mappers/workflowGraphMapper";

interface Props {
  node: FlowNode | undefined;
  onChangeLabel: (label: string) => void;
  onChangeConfig: (config: Record<string, unknown>) => void;
  onDelete: () => void;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function NodeInspector({ node, onChangeLabel, onChangeConfig, onDelete }: Props) {
  if (!node) {
    return (
      <div className="w-80 shrink-0 border-l border-border bg-surface p-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Inspector
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Select a node on the canvas to configure it.
        </p>
      </div>
    );
  }

  const config = node.data.config ?? {};
  const set = (key: string, value: unknown) => onChangeConfig({ ...config, [key]: value });
  const str = (key: string) => (config[key] == null ? "" : String(config[key]));

  return (
    <div className="w-80 shrink-0 space-y-4 overflow-y-auto border-l border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {node.data.nodeType}
        </p>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="node-name">Name</Label>
        <Input
          id="node-name"
          value={node.data.label}
          onChange={(event) => onChangeLabel(event.target.value)}
        />
      </div>

      {node.data.nodeType === "HTTP" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="node-url">URL</Label>
            <Input
              id="node-url"
              value={str("url")}
              onChange={(event) => set("url", event.target.value)}
              placeholder="https://api.example.com/orders"
            />
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={str("method") || "GET"} onValueChange={(value) => set("method", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="node-headers">Headers (JSON)</Label>
            <Textarea
              id="node-headers"
              className="font-mono text-xs"
              value={
                typeof config["headers"] === "string"
                  ? (config["headers"] as string)
                  : JSON.stringify(config["headers"] ?? {}, null, 2)
              }
              onChange={(event) => {
                try {
                  set("headers", JSON.parse(event.target.value || "{}"));
                } catch {
                  set("headers", event.target.value);
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="node-body">Body</Label>
            <Textarea
              id="node-body"
              className="font-mono text-xs"
              value={str("body")}
              onChange={(event) => set("body", event.target.value)}
            />
          </div>
        </>
      ) : null}

      {node.data.nodeType === "AI_PROMPT" ? (
        <div className="space-y-2">
          <Label htmlFor="node-prompt">Prompt</Label>
          <Textarea
            id="node-prompt"
            rows={8}
            className="font-mono text-xs"
            value={str("prompt")}
            onChange={(event) => set("prompt", event.target.value)}
            placeholder="Summarize the order for user {{input.userId}}"
          />
          <p className="text-xs text-muted-foreground">
            Expressions such as {"{{"}input.userId{"}}"} are resolved by the backend at runtime.
          </p>
        </div>
      ) : null}

      {node.data.nodeType === "CONDITION" || node.data.nodeType === "TRANSFORM" ? (
        <div className="space-y-2">
          <Label htmlFor="node-expression">Expression</Label>
          <Textarea
            id="node-expression"
            rows={5}
            className="font-mono text-xs"
            value={str("expression")}
            onChange={(event) => set("expression", event.target.value)}
          />
        </div>
      ) : null}

      {node.data.nodeType === "DELAY" ? (
        <div className="space-y-2">
          <Label htmlFor="node-duration">Duration (ms)</Label>
          <Input
            id="node-duration"
            type="number"
            value={str("durationMs")}
            onChange={(event) => set("durationMs", Number(event.target.value))}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="node-raw">Raw config (JSON)</Label>
        <Textarea
          id="node-raw"
          rows={6}
          className="font-mono text-xs"
          value={JSON.stringify(config, null, 2)}
          onChange={(event) => {
            try {
              onChangeConfig(JSON.parse(event.target.value || "{}"));
            } catch {
              /* keep last valid config until JSON parses */
            }
          }}
        />
      </div>
    </div>
  );
}
