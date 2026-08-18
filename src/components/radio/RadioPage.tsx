"use client";
import { useState, useEffect } from "react";
import { useRadioPlayer } from "./RadioPlayerContext";
import { useRadioConfig } from "@/hooks/use-queries";

export default function RadioPage() {
  const { isPlaying, currentTitle } = useRadioPlayer();
  const { data: config, isLoading } = useRadioConfig();

  return (
    <div>
      <h1>Rádio Web</h1>
      <p>Status: {isPlaying ? "Tocando" : "Parado"}</p>
      <p>Title: {currentTitle}</p>
      {config && (
        <p>Display: {config.display_name}</p>
      )}
      {isLoading && <p>Carregando config...</p>}
    </div>
  );
}
