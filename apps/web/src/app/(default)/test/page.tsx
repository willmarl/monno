"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Copy, Palette, Zap } from "lucide-react";
import { toastSuccess, toastError, toastInfo } from "@/lib/toast";
export default function UIKitPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [checkboxes, setCheckboxes] = useState({
    option1: false,
    option2: true,
    option3: false,
  });
  const [radioValue, setRadioValue] = useState("option1");
  const [textInput, setTextInput] = useState("");
  const [textArea, setTextArea] = useState("");
  const [selectValue, setSelectValue] = useState("option1");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(text);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const colors = [
    {
      name: "Primary",
      value: "oklch(0.205 0 0)",
      light: "oklch(0.922 0 0)",
      description: "Main brand color",
    },
    {
      name: "Secondary",
      value: "oklch(0.97 0 0)",
      light: "oklch(0.29 0 0)",
      description: "Supporting color",
    },
    {
      name: "Accent",
      value: "oklch(0.97 0 0)",
      light: "oklch(0.29 0 0)",
      description: "Interactive elements",
    },
    {
      name: "Destructive",
      value: "oklch(0.577 0.245 27.325)",
      light: "oklch(0.704 0.191 22.216)",
      description: "Danger/Error states",
    },
    {
      name: "Warning",
      value: "oklch(0.644 0.194 70.08)",
      light: "oklch(0.726 0.199 70.08)",
      description: "Warning states",
    },
    {
      name: "Success",
      value: "oklch(0.52 0.15 142)",
      light: "oklch(0.72 0.17 142)",
      description: "Success states",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-8">
      {/* Header */}
      <div className="mb-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Design System</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          A custom UI kit built with shadcn/ui, Tailwind CSS, and OKLCH color
          system
        </p>
      </div>

      {/* Color Palette Section */}
      <div className="max-w-7xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Color Palette
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {colors.map((color) => (
            <Card
              key={color.name}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{color.name}</CardTitle>
                <CardDescription>{color.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(color.value)}
                    className="flex-1 p-6 rounded-lg transition-all hover:scale-105 cursor-pointer border-2 border-muted"
                    style={{ backgroundColor: color.value }}
                  />
                  <button
                    onClick={() => copyToClipboard(color.light)}
                    className="flex-1 p-6 rounded-lg transition-all hover:scale-105 cursor-pointer border-2 border-muted"
                    style={{ backgroundColor: color.light }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => copyToClipboard(color.value)}
                    className="p-2 rounded bg-muted hover:bg-muted/80 text-muted-foreground truncate flex items-center justify-center gap-1 transition"
                  >
                    {copiedColor === color.value ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(color.light)}
                    className="p-2 rounded bg-muted hover:bg-muted/80 text-muted-foreground truncate flex items-center justify-center gap-1 transition"
                  >
                    {copiedColor === color.light ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Components Section */}
      <div className="max-w-7xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Button Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">Primary Button</Button>
              <Button variant="secondary" className="w-full">
                Secondary Button
              </Button>
              <Button variant="outline" className="w-full">
                Outline Button
              </Button>
              <Button variant="ghost" className="w-full">
                Ghost Button
              </Button>
              <Button variant="destructive" className="w-full">
                Destructive Button
              </Button>
              <Button disabled className="w-full">
                Disabled Button
              </Button>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Custom Badges
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    ✨ New
                  </div>
                  <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium">
                    🚀 Beta
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                    ✓ Active
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dropdown */}
          <Card>
            <CardHeader>
              <CardTitle>Dropdown Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Open Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Help</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Typography Section */}
      <div className="max-w-7xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">Typography</h2>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Display Heading</h1>
              <p className="text-sm text-muted-foreground">
                text-4xl font-bold
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Large Heading</h2>
              <p className="text-sm text-muted-foreground">
                text-3xl font-bold
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Medium Heading</h3>
              <p className="text-sm text-muted-foreground">
                text-2xl font-bold
              </p>
            </div>
            <div>
              <p className="text-lg font-medium mb-2">Body Large</p>
              <p className="text-sm text-muted-foreground">
                text-lg font-medium
              </p>
            </div>
            <div>
              <p className="text-base mb-2">
                Body Regular - This is the default body text size for most
                content
              </p>
              <p className="text-sm text-muted-foreground">text-base</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Body Small</p>
              <p className="text-xs text-muted-foreground">text-xs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gradient Examples */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Custom Backgrounds
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 rounded-lg bg-gradient-to-r from-primary to-primary/50 flex items-center justify-center text-white font-bold">
            Gradient Primary
          </div>
          <div className="h-32 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-foreground font-bold">
            Gradient Secondary
          </div>
          <div className="h-32 rounded-lg bg-gradient-to-r from-primary/20 to-transparent flex items-center justify-center text-foreground font-bold">
            Subtle Gradient
          </div>
          <div className="h-32 rounded-lg border-2 border-primary/30 bg-primary/5 flex items-center justify-center text-foreground font-bold">
            Outlined Container
          </div>
        </div>
      </div>

      {/* Form Inputs Section */}
      <div className="max-w-7xl mx-auto mt-16 mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">Form Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Checkboxes */}
          <Card>
            <CardHeader>
              <CardTitle>Checkboxes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="check1"
                  checked={checkboxes.option1}
                  onCheckedChange={(checked) =>
                    setCheckboxes({ ...checkboxes, option1: checked as boolean })
                  }
                />
                <Label htmlFor="check1" className="cursor-pointer">
                  Unchecked Option
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="check2"
                  checked={checkboxes.option2}
                  onCheckedChange={(checked) =>
                    setCheckboxes({ ...checkboxes, option2: checked as boolean })
                  }
                />
                <Label htmlFor="check2" className="cursor-pointer">
                  Checked Option
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="check3"
                  checked={checkboxes.option3}
                  onCheckedChange={(checked) =>
                    setCheckboxes({ ...checkboxes, option3: checked as boolean })
                  }
                />
                <Label htmlFor="check3" className="cursor-pointer">
                  Another Option
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox disabled id="check4" />
                <Label htmlFor="check4" className="cursor-not-allowed opacity-60">
                  Disabled Option
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Radio Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Radio Buttons</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                <div className="flex items-center gap-3 mb-3">
                  <RadioGroupItem value="option1" id="radio1" />
                  <Label htmlFor="radio1" className="cursor-pointer">
                    First Option
                  </Label>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <RadioGroupItem value="option2" id="radio2" />
                  <Label htmlFor="radio2" className="cursor-pointer">
                    Second Option
                  </Label>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <RadioGroupItem value="option3" id="radio3" />
                  <Label htmlFor="radio3" className="cursor-pointer">
                    Third Option
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="option4" id="radio4" disabled />
                  <Label htmlFor="radio4" className="cursor-not-allowed opacity-60">
                    Disabled Option
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Text Input */}
          <Card>
            <CardHeader>
              <CardTitle>Text Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text1">Default Input</Label>
                <Input
                  id="text1"
                  placeholder="Enter text..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text2">Email Input</Label>
                <Input
                  id="text2"
                  type="email"
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text3">Password Input</Label>
                <Input
                  id="text3"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text4">Disabled Input</Label>
                <Input
                  id="text4"
                  disabled
                  placeholder="Disabled..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Textarea */}
          <Card>
            <CardHeader>
              <CardTitle>Textarea</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="textarea1">Standard Textarea</Label>
                <Textarea
                  id="textarea1"
                  placeholder="Enter your message here..."
                  value={textArea}
                  onChange={(e) => setTextArea(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="textarea2">Disabled Textarea</Label>
                <Textarea
                  id="textarea2"
                  disabled
                  placeholder="This is disabled..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Select Dropdown */}
          <Card>
            <CardHeader>
              <CardTitle>Select Dropdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="select1">Choose an option</Label>
                <Select value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger id="select1">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">First Option</SelectItem>
                    <SelectItem value="option2">Second Option</SelectItem>
                    <SelectItem value="option3">Third Option</SelectItem>
                    <SelectItem value="option4">Fourth Option</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="select2">Disabled Select</Label>
                <Select disabled>
                  <SelectTrigger id="select2">
                    <SelectValue placeholder="Disabled..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Number & Range Input */}
          <Card>
            <CardHeader>
              <CardTitle>Number & Range</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="number1">Number Input</Label>
                <Input
                  id="number1"
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="range1">Range Slider</Label>
                <Input
                  id="range1"
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date1">Date Input</Label>
                <Input
                  id="date1"
                  type="date"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Toast Debug Section */}
      <div className="max-w-7xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Toast Notifications
        </h2>
        <div className="flex gap-1">
          <Button
            onClick={() =>
              toastSuccess("Success! Operation completed successfully.")
            }
          >
            Success Toast
          </Button>
          <Button onClick={() => toastError("Error! Something went wrong.")}>
            Error Toast
          </Button>
          <Button
            onClick={() => toastInfo("Info: This is an informational message.")}
          >
            Info Toast
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border">
        <p className="text-center text-muted-foreground text-sm">
          Design System • Built with shadcn/ui, Tailwind CSS & OKLCH Colors
        </p>
      </div>
    </div>
  );
}
