import aeFlag from "flag-icons/flags/4x3/ae.svg";
import arFlag from "flag-icons/flags/4x3/ar.svg";
import atFlag from "flag-icons/flags/4x3/at.svg";
import auFlag from "flag-icons/flags/4x3/au.svg";
import azFlag from "flag-icons/flags/4x3/az.svg";
import beFlag from "flag-icons/flags/4x3/be.svg";
import bhFlag from "flag-icons/flags/4x3/bh.svg";
import brFlag from "flag-icons/flags/4x3/br.svg";
import caFlag from "flag-icons/flags/4x3/ca.svg";
import chFlag from "flag-icons/flags/4x3/ch.svg";
import cnFlag from "flag-icons/flags/4x3/cn.svg";
import deFlag from "flag-icons/flags/4x3/de.svg";
import dkFlag from "flag-icons/flags/4x3/dk.svg";
import esFlag from "flag-icons/flags/4x3/es.svg";
import fiFlag from "flag-icons/flags/4x3/fi.svg";
import frFlag from "flag-icons/flags/4x3/fr.svg";
import gbFlag from "flag-icons/flags/4x3/gb.svg";
import huFlag from "flag-icons/flags/4x3/hu.svg";
import idFlag from "flag-icons/flags/4x3/id.svg";
import ieFlag from "flag-icons/flags/4x3/ie.svg";
import inFlag from "flag-icons/flags/4x3/in.svg";
import itFlag from "flag-icons/flags/4x3/it.svg";
import jpFlag from "flag-icons/flags/4x3/jp.svg";
import krFlag from "flag-icons/flags/4x3/kr.svg";
import mcFlag from "flag-icons/flags/4x3/mc.svg";
import mxFlag from "flag-icons/flags/4x3/mx.svg";
import myFlag from "flag-icons/flags/4x3/my.svg";
import nlFlag from "flag-icons/flags/4x3/nl.svg";
import nzFlag from "flag-icons/flags/4x3/nz.svg";
import ptFlag from "flag-icons/flags/4x3/pt.svg";
import qaFlag from "flag-icons/flags/4x3/qa.svg";
import ruFlag from "flag-icons/flags/4x3/ru.svg";
import saFlag from "flag-icons/flags/4x3/sa.svg";
import sgFlag from "flag-icons/flags/4x3/sg.svg";
import thFlag from "flag-icons/flags/4x3/th.svg";
import trFlag from "flag-icons/flags/4x3/tr.svg";
import usFlag from "flag-icons/flags/4x3/us.svg";
import zaFlag from "flag-icons/flags/4x3/za.svg";

// Keyed by the driver `nationality` demonym the backend serializes
// (e.g. "Dutch", "British"), as returned by the Ergast-compatible API.
export const nationalityFlags: Record<string, string> = {
  Argentine: arFlag,
  Australian: auFlag,
  Austrian: atFlag,
  Belgian: beFlag,
  Brazilian: brFlag,
  British: gbFlag,
  Canadian: caFlag,
  Chinese: cnFlag,
  Danish: dkFlag,
  Dutch: nlFlag,
  Finnish: fiFlag,
  French: frFlag,
  German: deFlag,
  Indian: inFlag,
  Indonesian: idFlag,
  Irish: ieFlag,
  Italian: itFlag,
  Japanese: jpFlag,
  Mexican: mxFlag,
  Monegasque: mcFlag,
  "New Zealander": nzFlag,
  "South African": zaFlag,
  Spanish: esFlag,
  Swiss: chFlag,
  Thai: thFlag,
  American: usFlag,
};

// Keyed by the race `country` field (a country name, not a demonym), as
// returned by the Ergast-compatible API for each circuit's location.
// Includes a couple of alternate spellings Ergast has used across seasons.
export const countryFlags: Record<string, string> = {
  Australia: auFlag,
  Austria: atFlag,
  Azerbaijan: azFlag,
  Bahrain: bhFlag,
  Belgium: beFlag,
  Brazil: brFlag,
  Canada: caFlag,
  China: cnFlag,
  France: frFlag,
  Germany: deFlag,
  Hungary: huFlag,
  India: inFlag,
  Italy: itFlag,
  Japan: jpFlag,
  Korea: krFlag,
  "South Korea": krFlag,
  Malaysia: myFlag,
  Mexico: mxFlag,
  Monaco: mcFlag,
  Netherlands: nlFlag,
  Portugal: ptFlag,
  Qatar: qaFlag,
  Russia: ruFlag,
  "Saudi Arabia": saFlag,
  Singapore: sgFlag,
  "South Africa": zaFlag,
  Spain: esFlag,
  Turkey: trFlag,
  UAE: aeFlag,
  "United Arab Emirates": aeFlag,
  "Great Britain": gbFlag,
  "United Kingdom": gbFlag,
  UK: gbFlag,
  USA: usFlag,
  "United States": usFlag,
};
