COPY public."ACPDivision" (id, name, code, "municipalZoneId", "createdAt", "updatedAt") FROM stdin;
1	Andheri East	ANDHERI_EAST	1	2025-12-22 10:43:27.323	2025-12-22 10:43:27.323
2	Andheri West	ANDHERI_WEST	1	2025-12-22 10:43:27.327	2025-12-22 10:43:27.327
3	Bandra East	BANDRA_EAST	2	2025-12-22 10:43:27.331	2025-12-22 10:43:27.331
5	ACP Zone 1	ACP1	5	2025-12-22 11:50:54.597	2025-12-22 11:50:54.597
\.


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: Commissionerate; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public."Commissionerate" (id, name, code, "createdAt", "updatedAt") FROM stdin;
1	Mumbai Police Commissionerate	MUMBAI_COMM	2025-12-22 10:43:27.282	2025-12-22 10:43:27.282
2	Pune Police Commissionerate	PUNE_COMM	2025-12-22 10:43:27.295	2025-12-22 10:43:27.295
3	Hyderabad	Hyd	2025-12-22 11:33:02.154	2025-12-22 11:33:02.154
\.


--
-- Data for Name: ComplaintAttachment; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public."ComplaintAttachment" (id, "complaintId", filename, url, "mimeType", size, "createdAt") FROM stdin;
10	13	Screenshot 2024-10-22 210000.png	/uploads/complaints/1767339110357-28phs3vlluf-Screenshot_2024-10-22_210000.png	image/png	9432	2026-01-02 07:31:50.412
11	14	Screenshot 2024-10-23 180142.png	/uploads/complaints/1767385228350-5haf0a88yxy-Screenshot_2024-10-23_180142.png	image/png	17137	2026-01-02 20:20:28.354
\.


--
-- Data for Name: DCPZone; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public."DCPZone" (id, name, code, "commissionerateId", "createdAt", "updatedAt") FROM stdin;
1	Zone I	ZONE_I	1	2025-12-22 10:43:27.3	2025-12-22 10:43:27.3
2	Zone II	ZONE_II	1	2025-12-22 10:43:27.304	2025-12-22 10:43:27.304
3	Pune Zone	PUNE_ZONE	2	2025-12-22 10:43:27.307	2025-12-22 10:43:27.307
5	DCP Zone 1	DCP1	3	2025-12-22 11:50:14.854	2025-12-22 11:50:14.854
\.


--
-- Data for Name: MunicipalZone; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public."MunicipalZone" (id, name, code, "dcpZoneId", "createdAt", "updatedAt") FROM stdin;
1	Andheri	ANDHERI	1	2025-12-22 10:43:27.311	2025-12-22 10:43:27.311
2	Bandra	BANDRA	1	2025-12-22 10:43:27.316	2025-12-22 10:43:27.316
3	Koregaon Park	KOREGAON_PARK	3	2025-12-22 10:43:27.32	2025-12-22 10:43:27.32
5	Municipal Zone 1	M1	5	2025-12-22 11:50:38.185	2025-12-22 11:50:38.185
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public."User" (id, name, email, "emailVerified", image, password, "passwordResetToken", "passwordResetTokenExp", role, "createdAt", "updatedAt") FROM stdin;
super-admin-6eeb45aa-537e-4069-8ed3-cbcb8554e46f	Super Administrator	admin@hydraa.com	2025-12-22 09:32:13.839	\N	$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYQmHqU3Gce	\N	\N	SUPER_ADMIN	2025-12-22 09:54:51.848	2025-12-22 09:54:51.848
super-admin-04bfa327-a824-4be5-b61c-d2d15e32df4e	Super Administrator	adminnew@hydraa.com	2025-12-22 09:33:47.487	\N	$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYQmHqU3Gce	\N	\N	SUPER_ADMIN	2025-12-22 09:54:51.848	2025-12-22 09:54:51.848
cmjgxhyio00004067f71hp257	JK	jelupuru@gmail.com	\N	\N	$2b$10$zhcl/W6X57QspdqUm61YjOloB6AfKTQHuIKgd5dD/cz8WIg.WgEqK	\N	\N	SUPER_ADMIN	2025-12-22 09:54:51.848	2025-12-22 09:54:51.848
cmjh16swl00008467sp4hi7ni	DCP	dcp@gmail.com	\N	\N	$2b$12$YmgK2O.cIV1U3ZIjtTPJ3.aRNmh79D.qfyOX60cQh16hdNGgod.Ru	\N	\N	DCP	2025-12-22 10:46:36.501	2025-12-22 10:46:36.501
cmjh172je00018467qxkcyaca	ACP	acp@gmail.com	\N	\N	$2b$12$rxRgOP5VrwxGUdP/m1MpEe.OTw2a4Y/CSjR0uQVlPt5BDpwZgk6ui	\N	\N	ACP	2025-12-22 10:46:48.986	2025-12-22 10:46:48.986
cmjh17dte00028467h3oqb7l9	comissioner	c@gmail.com	\N	\N	$2b$12$2C5Cr6fuMFxvyHi9ywFkpOuoejhgkl5P5zM.hC5XJYDlrfRsuMQMC	\N	\N	COMMISSIONER	2025-12-22 10:47:03.602	2025-12-22 10:47:03.602
cmji578mm00002467ibl54lxz	Super Admin	sa@gmail.com	\N	\N	$2b$12$38Uorqf5P6vCC2zrYMNgO.JGJe2Lp7hNJa5i./O6TYrPVs4JMIzIC	\N	\N	SUPER_ADMIN	2025-12-23 05:26:41.518	2025-12-23 05:26:41.518
cmji5lkf100005o67txf7o4sg	Complaintant	com@gmail.com	\N	\N	$2b$12$9iiOQupqExDDxIFEYNm1vO4r6Mxf9SPJu3HCLE0VK2JH4TguLZOlK	\N	\N	COMPLAINANT	2025-12-23 05:37:49.981	2025-12-23 05:37:49.981
cmjgyvvtf0000eo67pvp3chiq	Field Officer123	fo@gmail.com	\N	\N	$2b$12$L0bTHVgxPzVQFi/CjZUs7ep5HLvHsyXkJSrxLkyvA66WPHE7j0FF2	\N	\N	INVESTIGATION_OFFICER	2025-12-22 09:54:51.848	2025-12-22 09:54:51.848
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public.comments (id, content, "isInternal", "complaintId", "parentId", "createdById", "updatedById", "createdAt", "updatedAt") FROM stdin;
17	What is the status of this complaint	f	14	\N	cmjh16swl00008467sp4hi7ni	\N	2026-01-03 07:26:39.334	2026-01-03 07:26:39.334
\.


--
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public.complaints (id, "complaintId", "complaintUniqueId", "dateOfApplicationReceived", "complaintCategoryReceivedFrom", "natureOfComplaint", "placeOfComplaint", "addressOfComplaintPlace", "nameOfTheComplainant", "phoneOfTheComplainant", "addressOfTheComplainant", "briefDetailsOfTheComplaint", "detailsOfRespondent", "complaintPriority", "actionTakenBriefDetails", "legalIssues", "anyLegalIssues", "firRegistered", "firNumber", "firDetails", "investigationOfficerReviewComments", "investigationOfficerReviewDate", "finalStatus", "sourceOfComplaint", "modeOfComplaint", "noticeStatus", "peReport", "fieldVisitDate", "commissionerateId", "dcpZoneId", "municipalZoneId", "acpDivisionId", "createdById", "updatedById", "assignedToId", "createdAt", "updatedAt", "firstNoticeDate", "firstNoticeNumber", "firstNoticeStatus", "secondNoticeDate", "secondNoticeNumber", "secondNoticeStatus", "notice1AcpApprovalDate", "notice1AcpApprovedById", "notice1ApprovalStatus", "notice1CommissionerApprovalDate", "notice1CommissionerApprovedById", "notice1DcpApprovalDate", "notice1DcpApprovedById", "notice1RejectedById", "notice1RejectionDate", "notice1RejectionReason", "notice2AcpApprovalDate", "notice2AcpApprovedById", "notice2ApprovalStatus", "notice2CommissionerApprovalDate", "notice2CommissionerApprovedById", "notice2DcpApprovalDate", "notice2DcpApprovedById", "notice2RejectedById", "notice2RejectionDate", "notice2RejectionReason", "firstNoticeSentDate", "peDcpComments", "peDcpCommentsById", "peDcpCommentsDate", "peNotificationById", "peNotificationDate", "peNotificationSentToFieldOfficer", "secondNoticeSentDate", "peStatus", "peDiscussions", "firstNoticeContent", "secondNoticeContent", "firstNoticeDiscussions", "secondNoticeDiscussions", "firstNoticeCitizenReply", "firstNoticeCitizenReplyDate", "firstNoticeIssuedDate") FROM stdin;
13	CMP-1767339110343-AOB1CADMX	UNIQUE-CMP-1767339110343-AOB1CADMX	2026-01-02 07:31:50.343	\N	Dumping in Lake	Kothapet	Hyderabad\r\nHyderabad	Rohan Ranganath Dessai	09649649648	Flat No. 203,\r\nSri Sai Residency,\r\nKothapet, Hyderabad â€“ 500035,\r\nTelangana	Illegal dumping of construction debris and plastic waste has been happening near the lake area in Kothapet for the past two weeks. The waste is blocking water flow and causing foul smell. This may lead to health issues and environmental damage if not addressed immediately.	The dumping appears to be done by a nearby construction contractor operating without proper waste disposal arrangements. Exact details are unknown, but dumping usually occurs during late night hours.	HIGH	\N	\N	NO	NO	\N	\N	\N	\N	PENDING	PHONE	VERBAL	NOT_REQUIRED	[{"type":"p","children":[{"text":""}],"id":"8fgcKxRd86"},{"type":"p","children":[{"text":"Illegal dumping of construction debris and plastic waste was confirmed ","bold":true}],"id":"zeO7erP2Qn"},{"type":"p","children":[{"text":"No authorized dumping permission found for the said location "}],"id":"R2YcNhM8By"},{"type":"p","children":[{"text":"Activity poses: ","comment":true,"comment_WcspbC1WWbojBcnYzHIVx":true}],"id":"3LH6atxDYU"},{"indent":1,"listStyleType":"disc","type":"p","children":[{"text":"Environmental risk ","comment":true,"comment_1RcN-07RxtgNncjUul-cK":true}],"id":"jUbkHzl7o-"},{"indent":1,"listStyleType":"disc","type":"p","children":[{"text":"Public health concern ","comment":true,"comment_F7cTMTbK8FSCNlRCkwjRG":true}],"id":"t25T0Ch56a","listStart":2},{"indent":1,"listStyleType":"disc","type":"p","children":[{"text":"Violation of municipal waste management rules"}],"id":"ujTEsLw-Fz","listStart":3}]	\N	3	5	5	5	cmji5lkf100005o67txf7o4sg	cmjgyvvtf0000eo67pvp3chiq	\N	2026-01-02 07:31:50.349	2026-01-02 20:04:14.41	2026-01-02 17:36:30.953	13/Comm/HYDRAA/2025	ISSUED	\N	\N	NOT_ISSUED	2026-01-02 19:43:52.201	cmjh172je00018467qxkcyaca	APPROVED	2026-01-02 19:48:20.444	cmjh17dte00028467h3oqb7l9	2026-01-02 15:34:43.035	cmjh16swl00008467sp4hi7ni	\N	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	Set	cmjh16swl00008467sp4hi7ni	2026-01-02 11:48:29.638	cmjh16swl00008467sp4hi7ni	2026-01-02 11:57:33.494	t	\N	SUBMITTED	[{"id":"discussion1","comments":[{"id":"comment1","contentRich":[{"children":[{"text":"Comments are a great way to provide feedback and discuss changes."}],"type":"p"}],"createdAt":"2026-01-02T10:09:53.529Z","discussionId":"discussion1","isEdited":false,"userId":"charlie"},{"id":"comment2","contentRich":[{"children":[{"text":"Agreed! The link to the docs makes it easy to learn more."}],"type":"p"}],"createdAt":"2026-01-02T10:11:33.529Z","discussionId":"discussion1","isEdited":false,"userId":"bob"}],"createdAt":"2026-01-02T10:19:53.529Z","documentContent":"comments","isResolved":false,"userId":"charlie"},{"id":"discussion2","comments":[{"id":"comment1","contentRich":[{"children":[{"text":"Nice demonstration of overlapping annotations with both comments and suggestions!"}],"type":"p"}],"createdAt":"2026-01-02T10:14:53.529Z","discussionId":"discussion2","isEdited":false,"userId":"bob"},{"id":"comment2","contentRich":[{"children":[{"text":"This helps users understand how powerful the editor can be."}],"type":"p"}],"createdAt":"2026-01-02T10:16:33.529Z","discussionId":"discussion2","isEdited":false,"userId":"charlie"}],"createdAt":"2026-01-02T10:19:53.529Z","documentContent":"overlapping","isResolved":false,"userId":"bob"}]	[{"type":"p","children":[{"text":"This is to inform you that a "},{"text":"complaint ","comment":true,"comment_UzrafMiRPMJhTUdCiRFM5":true},{"text":"has been "},{"text":"received ","comment":true,"comment_6zoX5djrprXoViXW4VtBv":true},{"text":"and a preliminary enquiry has  this is a simple note again confirmed "},{"text":"illegal dumping of construction d can you","comment":true,"comment_px9Scidhlc_cB4H0uBoKP":true},{"text":" replace this with new content h activities and remove the "},{"text":"dumped ","comment":true,"comment_XLQrm4eXdbxZHj4RYsrP0":true},{"text":"material at your own cost within "},{"text":"70 days","bold":true},{"text":" from the date of receipt of this notice, failing which appropriate legal action, replace this with new one imposition of penalties and "},{"text":"r","comment":true,"comment_TSrEKR-EOSh4UqORrLf6q":true},{"text":"eplace this ","comment_TSrEKR-EOSh4UqORrLf6q":true},{"text":", will be "},{"text":"initiated ","comment":true,"comment_zxjq0d6IYflDoRwvCWGwg":true,"comment_qswbSZgd-f7ma2iqnUNFe":true},{"text":"without further notice as per law. save it here againa and again"}],"id":"n1kkPriR-r"},{"type":"p","id":"8PhphcyHgF","children":[{"text":""}]},{"type":"p","id":"giCD-eBiEA","children":[{"text":"Test again here can you make it "},{"text":"effectivy","comment":true,"comment_EfjQ0Qr6uxgpdputGL5UX":true}]},{"type":"p","id":"F8qgiOzoEJ","children":[{"text":"again ","comment":true,"comment_xLE44Eh5EfjOysPpIkuYw":true,"comment_cCEoOPMRR5piq6KSzGH_-":true},{"text":"this is not "},{"text":"that ","comment":true,"comment_chvn4iqPuyngEN3O_Z0hV":true},{"text":"much important for seeing the result of "},{"text":"notice ","comment":true,"comment_khiz-DxsGycjY2Cp51LNi":true},{"text":"one to three four"}]},{"type":"p","id":"HAL7MYPaAu","children":[{"text":""}]},{"type":"p","id":"B6RuelyvUe","children":[{"text":"again ","comment":true,"comment_cCEoOPMRR5piq6KSzGH_-":true},{"text":"this is not a simple mode of test so be tested is imtatnt give me so this is after toasted"}]},{"type":"p","id":"5Sd_xDcEcx","children":[{"text":""}]},{"type":"p","id":"6stWR4diU1","children":[{"text":"again this is a simple message this is a simple one message again this is again simple one and one"}]},{"type":"p","id":"3VytJCyPE8","children":[{"text":"is should be updated notice one updated wanted to see notification for toast i need to show the tast message show the notificationa hthis is anew "}]},{"type":"p","id":"ZEnH-_5MSq","children":[{"text":""}]},{"type":"p","id":"TA4f1lRKYI","children":[{"text":"this is the test matter"}]}]	\N	[{"id":"discussion1","comments":[{"id":"comment1","contentRich":[{"children":[{"text":"Comments are a great way to provide feedback and discuss changes."}],"type":"p"}],"createdAt":"2026-01-02T17:10:25.869Z","discussionId":"discussion1","isEdited":false,"userId":"charlie","userName":"Charlie","user":{"id":"charlie","avatarUrl":"https://api.dicebear.com/9.x/glass/svg?seed=charlie2","name":"Charlie"}},{"id":"comment2","contentRich":[{"children":[{"text":"Agreed! The link to the docs makes it easy to learn more."}],"type":"p"}],"createdAt":"2026-01-02T17:12:05.869Z","discussionId":"discussion1","isEdited":false,"userId":"bob","userName":"Bob","user":{"id":"bob","avatarUrl":"https://api.dicebear.com/9.x/glass/svg?seed=bob4","name":"Bob"}}],"createdAt":"2026-01-02T17:20:25.869Z","documentContent":"comments","isResolved":false,"userId":"charlie","userName":"Charlie","user":{"id":"charlie","avatarUrl":"https://api.dicebear.com/9.x/glass/svg?seed=charlie2","name":"Charlie"}},{"id":"discussion2","comments":[{"id":"comment1","contentRich":[{"children":[{"text":"Nice demonstration of overlapping annotations with both comments and suggestions!"}],"type":"p"}],"createdAt":"2026-01-02T17:15:25.869Z","discussionId":"discussion2","isEdited":false,"userId":"bob","userName":"Bob","user":{"id":"bob","avatarUrl":"https://api.dicebear.com/9.x/glass/svg?seed=bob4","name":"Bob"}},{"id":"comment2","contentRich":[{"children":[{"text":"This helps users understand how powerful the editor can be."}],"type":"p"}],"createdAt":"2026-01-02T17:17:05.869Z","discussionId":"discussion2","isEdited":false,"userId":"charlie","userName":"Charlie","user":{"id":"charlie","avatarUrl":"https://api.dicebear.com/9.x/glass/svg?seed=charlie2","name":"Charlie"}}],"createdAt":"2026-01-02T17:20:25.869Z","documentContent":"overlapping","isResolved":false,"userId":"bob","userName":"Bob","user":{"id":"bob","avatarUrl":"https://api.dicebear.com/9.x/glass/svg?seed=bob4","name":"Bob"}}]	\N	\N	\N	2025-12-30 00:00:00
14	CMP-1767385228336-PGLGRPSSC	UNIQUE-CMP-1767385228336-PGLGRPSSC	2026-01-02 20:20:28.337	\N	Park Encroachment	Kothapet	Phase-3 Avasa 59	Jaya kumar reddy elupuru	09100496538	asdfadf	fasdf	asdf	NORMAL	\N	\N	NO	NO	\N	\N	\N	\N	PENDING	PHONE	ONLINE	NOT_REQUIRED	[{"type":"p","children":[{"text":"This is to inform you that a complaint has been received and a preliminary enquiry has confirmed illegal dumping of "},{"text":"construction ","comment":true,"comment_ypUFAnYJzOFARgGXomanx":true},{"text":"debris and plastic waste near Kothapet Lake, Hyderabad, which constitutes a violation of applicable municipal and environmental regulations. You are hereby directed to immediately cease such activities and remove the dumped material at your own cost within "},{"text":"7 days","bold":true},{"text":" from the date of receipt of this notice, failing which appropriate legal action, including imposition of penalties and prosecution, will be initiated without further notice as per law."}],"id":"uSsoB1VzAa"}]	\N	3	5	5	5	cmji5lkf100005o67txf7o4sg	cmjgyvvtf0000eo67pvp3chiq	\N	2026-01-02 20:20:28.343	2026-01-03 08:15:05.602	2026-01-03 07:59:13.602	14/Comm/HYDRAA/2025	ISSUED	\N	\N	NOT_ISSUED	2026-01-03 08:14:40.982	cmjh172je00018467qxkcyaca	APPROVED	2026-01-03 08:15:05.599	cmjh17dte00028467h3oqb7l9	2026-01-03 08:14:14.366	cmjh16swl00008467sp4hi7ni	\N	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	cmjh16swl00008467sp4hi7ni	2026-01-02 20:21:22.622	t	\N	SUBMITTED	[{"id":"ypUFAnYJzOFARgGXomanx","comments":[{"id":"Vty_to-glzf_MD_hIJn2V","contentRich":[{"children":[{"text":"This is a comment added here"}],"type":"p","id":"wM3g7TjhuT"}],"createdAt":"2026-01-03T08:10:16.836Z","discussionId":"ypUFAnYJzOFARgGXomanx","isEdited":false,"userId":"cmjgyvvtf0000eo67pvp3chiq"}],"createdAt":"2026-01-03T08:10:16.836Z","documentContent":"construction ","isResolved":false,"userId":"cmjgyvvtf0000eo67pvp3chiq"}]	[{"type":"p","children":[{"text":"This is the first point"}],"id":"SwJ0zL8oQe"},{"type":"p","id":"G_J51pBasp","children":[{"text":"This is the second point for notice"}]}]	\N	[]	\N	\N	\N	\N
\.


--
-- Data for Name: firs; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public.firs (id, "firNumber", "dateOfRegistration", "policeStation", "investigatingOfficer", "investigatingOfficerContact", "sectionsApplied", status, details, remarks, "complaintId", "createdById", "updatedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notice1_review_comments; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public.notice1_review_comments (id, comment, "reviewerRole", "complaintId", "userId", "createdAt", "updatedAt") FROM stdin;
b1b584cd-95c0-4cc4-85f7-42edba8f61f4	Test one test one	DCP	13	cmjh16swl00008467sp4hi7ni	2026-01-02 12:55:43.485	2026-01-02 12:55:43.485
2829f464-bba6-4d7a-be89-cb55377f7525	test two	DCP	13	cmjh16swl00008467sp4hi7ni	2026-01-02 12:55:49.407	2026-01-02 12:55:49.407
\.


--
-- Data for Name: pe_comments; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public.pe_comments (id, "commentId", content, resolved, "complaintId", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: pe_review_comments; Type: TABLE DATA; Schema: public; Owner: hydraa_user
--

COPY public.pe_review_comments (id, comment, "reviewerRole", "complaintId", "userId", "createdAt", "updatedAt") FROM stdin;
cfaa4b57-60a1-4f35-bf2e-3c19ac761fee	set again	DCP	13	cmjh16swl00008467sp4hi7ni	2026-01-02 11:55:21.841	2026-01-02 11:55:21.841
48b8a168-afde-4260-8378-20fcead0fda8	more and more\n	DCP	13	cmjh16swl00008467sp4hi7ni	2026-01-02 11:55:35.764	2026-01-02 11:55:35.764
79d07587-e1a6-45c8-920f-7cd927768796	Done	DCP	14	cmjh16swl00008467sp4hi7ni	2026-01-03 07:26:13.282	2026-01-03 07:26:13.282
\.


--
-- Name: ACPDivision_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hydraa_user
--

SELECT pg_catalog.setval('public."ACPDivision_id_seq"', 5, true);


--
-- Name: Commissionerate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hydraa_user
--

SELECT pg_catalog.setval('public."Commissionerate_id_seq"', 3, true);


--
-- Name: ComplaintAttachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hydraa_user
--

SELECT pg_catalog.setval('public."ComplaintAttachment_id_seq"', 11, true);


--
-- Name: DCPZone_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hydraa_user
--

SELECT pg_catalog.setval('public."DCPZone_id_seq"', 5, true);


--
-- Name: MunicipalZone_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hydraa_user
--

SELECT pg_catalog.setval('public."MunicipalZone_id_seq"', 5, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hydraa_user
--

SELECT pg_catalog.setval('public.comments_id_seq', 17, true);


--
-- Name: complaints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hydraa_user
--

SELECT pg_catalog.setval('public.complaints_id_seq', 14, true);


--
-- Name: firs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hydraa_user
--

SELECT pg_catalog.setval('public.firs_id_seq', 1, true);


--
-- Name: ACPDivision ACPDivision_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."ACPDivision"
    ADD CONSTRAINT "ACPDivision_pkey" PRIMARY KEY (id);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Commissionerate Commissionerate_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."Commissionerate"
    ADD CONSTRAINT "Commissionerate_pkey" PRIMARY KEY (id);


--
-- Name: ComplaintAttachment ComplaintAttachment_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."ComplaintAttachment"
    ADD CONSTRAINT "ComplaintAttachment_pkey" PRIMARY KEY (id);


--
-- Name: DCPZone DCPZone_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."DCPZone"
    ADD CONSTRAINT "DCPZone_pkey" PRIMARY KEY (id);


--
-- Name: MunicipalZone MunicipalZone_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."MunicipalZone"
    ADD CONSTRAINT "MunicipalZone_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- Name: firs firs_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.firs
    ADD CONSTRAINT firs_pkey PRIMARY KEY (id);


--
-- Name: notice1_review_comments notice1_review_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.notice1_review_comments
    ADD CONSTRAINT notice1_review_comments_pkey PRIMARY KEY (id);


--
-- Name: pe_comments pe_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.pe_comments
    ADD CONSTRAINT pe_comments_pkey PRIMARY KEY (id);


--
-- Name: pe_review_comments pe_review_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.pe_review_comments
    ADD CONSTRAINT pe_review_comments_pkey PRIMARY KEY (id);


--
-- Name: ACPDivision_code_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "ACPDivision_code_key" ON public."ACPDivision" USING btree (code);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Commissionerate_code_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "Commissionerate_code_key" ON public."Commissionerate" USING btree (code);


--
-- Name: DCPZone_code_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "DCPZone_code_key" ON public."DCPZone" USING btree (code);


--
-- Name: MunicipalZone_code_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "MunicipalZone_code_key" ON public."MunicipalZone" USING btree (code);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_passwordResetToken_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "User_passwordResetToken_key" ON public."User" USING btree ("passwordResetToken");


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: complaints_complaintId_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "complaints_complaintId_key" ON public.complaints USING btree ("complaintId");


--
-- Name: complaints_complaintUniqueId_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "complaints_complaintUniqueId_key" ON public.complaints USING btree ("complaintUniqueId");


--
-- Name: firs_firNumber_key; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE UNIQUE INDEX "firs_firNumber_key" ON public.firs USING btree ("firNumber");


--
-- Name: notice1_review_comments_complaintId_idx; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE INDEX "notice1_review_comments_complaintId_idx" ON public.notice1_review_comments USING btree ("complaintId");


--
-- Name: notice1_review_comments_userId_idx; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE INDEX "notice1_review_comments_userId_idx" ON public.notice1_review_comments USING btree ("userId");


--
-- Name: pe_comments_commentId_idx; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE INDEX "pe_comments_commentId_idx" ON public.pe_comments USING btree ("commentId");


--
-- Name: pe_comments_complaintId_idx; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE INDEX "pe_comments_complaintId_idx" ON public.pe_comments USING btree ("complaintId");


--
-- Name: pe_review_comments_complaintId_idx; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE INDEX "pe_review_comments_complaintId_idx" ON public.pe_review_comments USING btree ("complaintId");


--
-- Name: pe_review_comments_userId_idx; Type: INDEX; Schema: public; Owner: hydraa_user
--

CREATE INDEX "pe_review_comments_userId_idx" ON public.pe_review_comments USING btree ("userId");


--
-- Name: ACPDivision ACPDivision_municipalZoneId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."ACPDivision"
    ADD CONSTRAINT "ACPDivision_municipalZoneId_fkey" FOREIGN KEY ("municipalZoneId") REFERENCES public."MunicipalZone"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ComplaintAttachment ComplaintAttachment_complaintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."ComplaintAttachment"
    ADD CONSTRAINT "ComplaintAttachment_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES public.complaints(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DCPZone DCPZone_commissionerateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."DCPZone"
    ADD CONSTRAINT "DCPZone_commissionerateId_fkey" FOREIGN KEY ("commissionerateId") REFERENCES public."Commissionerate"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MunicipalZone MunicipalZone_dcpZoneId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."MunicipalZone"
    ADD CONSTRAINT "MunicipalZone_dcpZoneId_fkey" FOREIGN KEY ("dcpZoneId") REFERENCES public."DCPZone"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_complaintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES public.complaints(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: comments comments_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_acpDivisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_acpDivisionId_fkey" FOREIGN KEY ("acpDivisionId") REFERENCES public."ACPDivision"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_commissionerateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_commissionerateId_fkey" FOREIGN KEY ("commissionerateId") REFERENCES public."Commissionerate"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: complaints complaints_dcpZoneId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_dcpZoneId_fkey" FOREIGN KEY ("dcpZoneId") REFERENCES public."DCPZone"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_municipalZoneId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_municipalZoneId_fkey" FOREIGN KEY ("municipalZoneId") REFERENCES public."MunicipalZone"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_notice1AcpApprovedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_notice1AcpApprovedById_fkey" FOREIGN KEY ("notice1AcpApprovedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_notice1CommissionerApprovedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_notice1CommissionerApprovedById_fkey" FOREIGN KEY ("notice1CommissionerApprovedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_notice1DcpApprovedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_notice1DcpApprovedById_fkey" FOREIGN KEY ("notice1DcpApprovedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_notice1RejectedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_notice1RejectedById_fkey" FOREIGN KEY ("notice1RejectedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_notice2AcpApprovedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_notice2AcpApprovedById_fkey" FOREIGN KEY ("notice2AcpApprovedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_notice2CommissionerApprovedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_notice2CommissionerApprovedById_fkey" FOREIGN KEY ("notice2CommissionerApprovedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_notice2DcpApprovedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_notice2DcpApprovedById_fkey" FOREIGN KEY ("notice2DcpApprovedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_notice2RejectedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_notice2RejectedById_fkey" FOREIGN KEY ("notice2RejectedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_peDcpCommentsById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_peDcpCommentsById_fkey" FOREIGN KEY ("peDcpCommentsById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_peNotificationById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_peNotificationById_fkey" FOREIGN KEY ("peNotificationById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: complaints complaints_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT "complaints_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: firs firs_complaintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.firs
    ADD CONSTRAINT "firs_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES public.complaints(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: firs firs_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.firs
    ADD CONSTRAINT "firs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: firs firs_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.firs
    ADD CONSTRAINT "firs_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notice1_review_comments notice1_review_comments_complaintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.notice1_review_comments
    ADD CONSTRAINT "notice1_review_comments_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES public.complaints(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notice1_review_comments notice1_review_comments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.notice1_review_comments
    ADD CONSTRAINT "notice1_review_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pe_comments pe_comments_complaintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.pe_comments
    ADD CONSTRAINT "pe_comments_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES public.complaints(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pe_comments pe_comments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.pe_comments
    ADD CONSTRAINT "pe_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pe_review_comments pe_review_comments_complaintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.pe_review_comments
    ADD CONSTRAINT "pe_review_comments_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES public.complaints(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pe_review_comments pe_review_comments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hydraa_user
--

ALTER TABLE ONLY public.pe_review_comments
    ADD CONSTRAINT "pe_review_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--
