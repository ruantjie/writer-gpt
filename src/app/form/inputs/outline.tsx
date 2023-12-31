"use client";

import React, { useState } from "react";

import { Rotate3d } from "lucide-react";
import {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch
} from "react-hook-form";

import {
  outlinePrompt,
  outlineRegeneratePrompt,
  outlineRegeneratePromptSystem
} from "@config/chat";

import { useDisabled } from "@store/disabled";
import { useLoading } from "@store/loading";
import { useSettings } from "@store/settings";
import { useToken } from "@store/token";

import { SettingsMenu } from "@components/SettingsMenu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@components/ui/context-menu";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";

import { chat } from "@lib/openai";
import { hasKeywords } from "@lib/utils";

import { GenerateContent } from "../index";

type Props = {
  setValue: UseFormSetValue<GenerateContent>;
  register: UseFormRegister<GenerateContent>;
  watch: UseFormWatch<GenerateContent>;
  errors: FieldErrors<GenerateContent>;
};

export const OutlineInput = ({ setValue, register, watch, errors }: Props) => {
  const { token } = useToken();
  const { settings, setSettings } = useSettings();
  const { setOutlineLoading, outlineLoading } = useLoading();
  const {
    setFormDisabled,
    setMainDisabled,
    setSecondaryDisabled,
    outlineDisabled
  } = useDisabled();

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const [selectedText, setSelectedText] = useState<string>("");

  const [keywords, outline] = watch(["keywords", "outline"]);

  const noKeywords = !hasKeywords(keywords?.main);

  const { ref: outlineRef, ...outlineProps } = register("outline");

  const onGenerateOutline = async () => {
    if (!token) return;

    setOutlineLoading(true);
    setFormDisabled(true);
    setMainDisabled(true);
    setSecondaryDisabled(true);

    try {
      const response = await chat({
        key: token,
        model: settings.model.outline,
        messages: [
          {
            role: "user",
            content: outlinePrompt.replaceAll("{{keywords}}", keywords.main)
          }
        ]
      });

      if (response) setValue("outline", response);
    } catch (error) {
      // Handle fetch request errors
    }

    setOutlineLoading(false);
    setFormDisabled(false);
    setMainDisabled(false);
    setSecondaryDisabled(false);
  };

  const onRegenerate = async () => {
    if (!token || !selectedText.trim()) return;

    setOutlineLoading(true);
    setFormDisabled(true);
    setMainDisabled(true);
    setSecondaryDisabled(true);

    try {
      const response = await chat({
        key: token,
        model: settings.model.outline,
        messages: [
          {
            role: "system",
            content: outlineRegeneratePromptSystem
          },
          {
            role: "user",
            content: outlineRegeneratePrompt
              .replace("{{section}}", selectedText)
              .replace("{{outline}}", outline)
              .replace(
                "{{keywords}}",
                `${keywords.main}\n${keywords.secondary}`
              )
          }
        ]
      });

      if (response)
        setValue("outline", outline.replace(selectedText, response));
    } catch (error) {
      // Handle fetch request errors
    }

    setOutlineLoading(false);
    setFormDisabled(false);
    setMainDisabled(false);
    setSecondaryDisabled(false);
  };

  const onSelectText = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value.substring(start, end);
    setSelectedText(text);
  };

  return (
    <div className="flex flex-col gap-2 md:col-span-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="outline">Outline</Label>

        <SettingsMenu
          loadingGenerate={
            outlineLoading || outlineDisabled || !hasKeywords(keywords?.main)
          }
          onGenerate={onGenerateOutline}
          selectedModel={settings.model.outline}
          onModel={model => {
            const settingsCopy = structuredClone(settings);
            settingsCopy.model.outline = model;

            setSettings(settingsCopy);
          }}
        />
      </div>

      <ContextMenu>
        <ContextMenuTrigger disabled={noKeywords}>
          <Textarea
            disabled={!token || noKeywords || outlineDisabled}
            id="outline"
            placeholder="Introduction..."
            loading={outlineLoading}
            error={errors?.outline?.message}
            {...outlineProps}
            onBlur={onSelectText}
            ref={e => {
              outlineRef(e);

              textareaRef.current = e;
            }}
          />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={onRegenerate}
            disabled={outlineDisabled || outlineLoading}
          >
            <Rotate3d className="mr-2 h-4 w-4" />
            <span>Regenerate</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};
