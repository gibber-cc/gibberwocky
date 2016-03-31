{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 7,
			"minor" : 1,
			"revision" : 0,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"rect" : [ 73.0, 79.0, 944.0, 468.0 ],
		"bglocked" : 0,
		"openinpresentation" : 0,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 1,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "",
		"subpatcher_template" : "",
		"boxes" : [ 			{
				"box" : 				{
					"id" : "obj-5",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 697.0, 435.0, 169.0, 22.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-18",
					"linecount" : 3,
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 775.0, 342.5, 59.0, 47.0 ],
					"style" : "",
					"text" : "space toggles playback"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-17",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "" ],
					"patching_rect" : [ 768.0, 325.0, 43.0, 22.0 ],
					"style" : "",
					"text" : "sel 32"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-16",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 4,
					"outlettype" : [ "int", "int", "int", "int" ],
					"patching_rect" : [ 768.0, 299.0, 50.5, 22.0 ],
					"style" : "",
					"text" : "key"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-15",
					"maxclass" : "toggle",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 753.0, 357.0, 24.0, 24.0 ],
					"style" : ""
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-13",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 0,
					"patching_rect" : [ 768.0, 245.5, 37.0, 22.0 ],
					"style" : "",
					"text" : "dac~"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-12",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 0,
					"patching_rect" : [ 3.0, 422.0, 261.0, 22.0 ],
					"style" : "",
					"text" : "dac~"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-9",
					"linecount" : 2,
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 763.75, 262.0, 59.0, 33.0 ],
					"style" : "",
					"text" : "auto audio on"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-8",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 753.0, 215.0, 72.0, 22.0 ],
					"style" : "",
					"text" : "loadmess 1"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-7",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 9,
					"outlettype" : [ "int", "int", "float", "float", "float", "", "int", "float", "" ],
					"patching_rect" : [ 753.0, 386.0, 103.0, 22.0 ],
					"style" : "",
					"text" : "transport"
				}

			}
, 			{
				"box" : 				{
					"autosave" : 1,
					"bgmode" : 1,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-2",
					"lockeddragscroll" : 0,
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 4,
					"offset" : [ 0.0, 0.0 ],
					"outlettype" : [ "signal", "signal", "", "" ],
					"patching_rect" : [ 3.0, 212.0, 745.0, 196.0 ],
					"presentation_rect" : [ 0.0, 0.0, 745.0, 196.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_invisible" : 1,
							"parameter_longname" : "amxd~[1]",
							"parameter_shortname" : "amxd~[1]",
							"parameter_type" : 3
						}

					}
,
					"saved_object_attributes" : 					{
						"annotation_name" : "",
						"parameter_enable" : 1,
						"patchername" : "Laverne.amxd",
						"patchername_fallback" : "C74:/packages/Max for Live/patchers/Max Instrument/Laverne/Laverne.amxd"
					}
,
					"snapshot" : 					{
						"filetype" : "C74Snapshot",
						"version" : 2,
						"minorversion" : 0,
						"name" : "snapshotlist",
						"origin" : "max~",
						"type" : "list",
						"subtype" : "Undefined",
						"embed" : 1,
						"snapshot" : 						{
							"name" : "Laverne.amxd",
							"origname" : "C74:/packages/Max for Live/patchers/Max Instrument/Laverne/Laverne.amxd",
							"valuedictionary" : 							{
								"parameter_values" : 								{
									"Attack" : 8.0,
									"Decay" : 123.0,
									"Release" : 299.0,
									"Sustain" : 39.0,
									"VelMod" : 33.0,
									"cutoff" : 1289.359985,
									"env_amount" : 100.0,
									"filter_attack" : 1.0,
									"filter_decay" : 102.0,
									"filter_release" : 139.0,
									"filter_resonance" : 0.528,
									"filter_sustain" : 66.0,
									"filter_tracking" : 6.4,
									"filter_velocity" : 50.0,
									"level" : 0.0,
									"osc1_level" : 100.0,
									"osc1_octave" : 0.0,
									"osc1_tune" : 0.0,
									"osc1_wave" : 1.0,
									"osc2_level" : 100.0,
									"osc2_octave" : 0.0,
									"osc2_tune" : 15.0,
									"osc2_wave" : 1.0,
									"voices" : 4.0
								}

							}

						}
,
						"snapshotlist" : 						{
							"current_snapshot" : 0,
							"entries" : [ 								{
									"filetype" : "C74Snapshot",
									"version" : 2,
									"minorversion" : 0,
									"name" : "Laverne.amxd",
									"origin" : "Laverne.amxd",
									"type" : "amxd",
									"subtype" : "Undefined",
									"embed" : 1,
									"snapshot" : 									{
										"name" : "Laverne.amxd",
										"origname" : "C74:/packages/Max for Live/patchers/Max Instrument/Laverne/Laverne.amxd",
										"valuedictionary" : 										{
											"parameter_values" : 											{
												"Attack" : 8.0,
												"Decay" : 123.0,
												"Release" : 299.0,
												"Sustain" : 39.0,
												"VelMod" : 33.0,
												"cutoff" : 1289.359985,
												"env_amount" : 100.0,
												"filter_attack" : 1.0,
												"filter_decay" : 102.0,
												"filter_release" : 139.0,
												"filter_resonance" : 0.528,
												"filter_sustain" : 66.0,
												"filter_tracking" : 6.4,
												"filter_velocity" : 50.0,
												"level" : 0.0,
												"osc1_level" : 100.0,
												"osc1_octave" : 0.0,
												"osc1_tune" : 0.0,
												"osc1_wave" : 1.0,
												"osc2_level" : 100.0,
												"osc2_octave" : 0.0,
												"osc2_tune" : 15.0,
												"osc2_wave" : 1.0,
												"voices" : 4.0
											}

										}

									}
,
									"fileref" : 									{
										"name" : "Laverne.amxd",
										"filename" : "Laverne.amxd.maxsnap",
										"filepath" : "~/Documents/Max 7/Snapshots",
										"filepos" : -1,
										"snapshotfileid" : "c6480d0b637e642b8e1aa0637e67fa21"
									}

								}
 ]
						}

					}
,
					"style" : "",
					"text" : "amxd~ Laverne.amxd",
					"varname" : "amxd~[1]",
					"viewvisibility" : 1
				}

			}
, 			{
				"box" : 				{
					"autosave" : 1,
					"bgmode" : 1,
					"border" : 0,
					"clickthrough" : 0,
					"enablehscroll" : 0,
					"enablevscroll" : 0,
					"id" : "obj-1",
					"lockeddragscroll" : 0,
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 4,
					"offset" : [ 0.0, 0.0 ],
					"outlettype" : [ "signal", "signal", "", "" ],
					"patching_rect" : [ 3.0, 0.0, 876.5, 196.0 ],
					"presentation_rect" : [ 0.0, 0.0, 876.5, 196.0 ],
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_invisible" : 1,
							"parameter_longname" : "amxd~",
							"parameter_shortname" : "amxd~",
							"parameter_type" : 3
						}

					}
,
					"saved_object_attributes" : 					{
						"annotation_name" : "",
						"parameter_enable" : 1,
						"patchername" : "jibberwocky.amxd",
						"patchername_fallback" : "/www/gibberMax/jibberwocky.amxd"
					}
,
					"snapshot" : 					{
						"filetype" : "C74Snapshot",
						"version" : 2,
						"minorversion" : 0,
						"name" : "snapshotlist",
						"origin" : "max~",
						"type" : "list",
						"subtype" : "Undefined",
						"embed" : 1,
						"snapshot" : 						{
							"name" : "jibberwocky.amxd",
							"origname" : "/www/gibberMax/jibberwocky.amxd",
							"valuedictionary" : 							{
								"parameter_values" : 								{

								}

							}

						}
,
						"snapshotlist" : 						{
							"current_snapshot" : 0,
							"entries" : [ 								{
									"filetype" : "C74Snapshot",
									"version" : 2,
									"minorversion" : 0,
									"name" : "jibberwocky.amxd",
									"origin" : "jibberwocky.amxd",
									"type" : "amxd",
									"subtype" : "Undefined",
									"embed" : 1,
									"snapshot" : 									{
										"name" : "jibberwocky.amxd",
										"origname" : "/www/gibberMax/jibberwocky.amxd",
										"valuedictionary" : 										{
											"parameter_values" : 											{

											}

										}

									}
,
									"fileref" : 									{
										"name" : "jibberwocky.amxd",
										"filename" : "jibberwocky.amxd.maxsnap",
										"filepath" : "~/Documents/Max 7/Snapshots",
										"filepos" : -1,
										"snapshotfileid" : "c1f551202d151adc4aab33399e46fc25"
									}

								}
 ]
						}

					}
,
					"style" : "",
					"text" : "amxd~ /Users/grrrwaaa/code/gibber.max/client/jiffy.amxd",
					"varname" : "amxd~",
					"viewvisibility" : 1
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-2", 2 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-1", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-5", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-1", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-7", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-15", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-17", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-16", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-15", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-17", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-12", 1 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-2", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-12", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-2", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-13", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"source" : [ "obj-8", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-15", 0 ],
					"disabled" : 0,
					"hidden" : 0,
					"midpoints" : [ 762.5, 299.5, 762.5, 299.5 ],
					"source" : [ "obj-8", 0 ]
				}

			}
 ],
		"parameters" : 		{
			"obj-2" : [ "amxd~[1]", "amxd~[1]", 0 ],
			"obj-1" : [ "amxd~", "amxd~", 0 ]
		}
,
		"dependency_cache" : [ 			{
				"name" : "jibberwocky.amxd.maxsnap",
				"bootpath" : "~/Documents/Max 7/Snapshots",
				"type" : "mx@s",
				"implicit" : 1
			}
, 			{
				"name" : "jibberwocky.amxd",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen0.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen1.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen2.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen3.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen4.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen5.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen6.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen7.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen8.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen9.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen10.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen11.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen12.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen13.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen14.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "jibbergen15.maxpat",
				"bootpath" : "/www/gibberMax",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "Laverne.amxd.maxsnap",
				"bootpath" : "~/Documents/Max 7/Snapshots",
				"type" : "mx@s",
				"implicit" : 1
			}
, 			{
				"name" : "Laverne.amxd",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "lav.Voice~.maxpat",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "pluggo.voiceExclude.maxpat",
				"type" : "JSON",
				"implicit" : 1
			}
, 			{
				"name" : "ws.mxo",
				"type" : "iLaX"
			}
 ],
		"autosave" : 0
	}

}
