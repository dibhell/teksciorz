import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Sun, Moon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";

// --- DEMO tekst (startowy) ---
const DEMO = `To jest test
Wers drugi
Kolejna linia`;

function countConsonants(word: string) {
  return (word.match(/[bcćdfghjklłmnńprsśtwyzźż]/gi) || []).length;
}

function analyzeLine(line: string) {
  const words = line.trim().split(/\s+/);
  const consonants = words.map((w) => countConsonants(w));
  return { words, consonants };
}

export default function App() {
  const [text, setText] = useState(DEMO);
  const [dark, setDark] = useState(false);

  const lines = useMemo(
    () => text.replaceAll("\r", "").split("\n"),
    [text]
  );

  const analysis = useMemo(
    () => lines.map((line) => analyzeLine(line)),
    [lines]
  );

  const chartData = lines.map((line, i) => ({
    name: `Linia ${i + 1}`,
    consonants: line.replace(/[^bcćdfghjklłmnńprsśtwyzźż]/gi, "").length,
  }));

  return (
    <div className={dark ? "dark bg-slate-900 text-slate-100 min-h-screen" : "bg-slate-50 text-slate-900 min-h-screen"}>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎶 Rytmika Tekstu</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDark((d) => !d)}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>

        {/* Input */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <label className="font-semibold">Wklej swój tekst:</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Analysis */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-4">Analiza</h2>
            <div className="space-y-2">
              {analysis.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 rounded-md border border-slate-300 dark:border-slate-700"
                >
                  <span className="font-semibold">Linia {i + 1}: </span>
                  {line.words.map((w, wi) => {
                    const c = countConsonants(w);
                    return (
                      <TooltipProvider key={wi}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant={c >= 3 ? "destructive" : "outline"}
                              className="mx-1"
                            >
                              {w}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            Spółgłoski: {c}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-4">Wykres spółgłosek</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#cbd5e1"} />
                <XAxis dataKey="name" stroke={dark ? "#e2e8f0" : "#1e293b"} />
                <YAxis stroke={dark ? "#e2e8f0" : "#1e293b"} />
                <ReTooltip />
                <Bar dataKey="consonants" fill={dark ? "#60a5fa" : "#2563eb"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold">Legenda</h2>
            <div className="space-y-1">
              <p><Badge variant="destructive">Czerwony</Badge> – słowo z ≥ 3 spółgłoskami</p>
              <p><Badge variant="outline">Szary</Badge> – słowo z &lt; 3 spółgłoskami</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
