# Cached AI output for the sample documents, written to the simplification prompt's rules:
# only facts from the passage, numbers and terms kept, sentences of 15 words or fewer.
# Lists are in paragraph order; summaries are per section, in section order.

CELL_SIMPLE = [
  "A cell is the smallest unit of a living thing. Some living things have one cell, like a bacterium. Others have trillions of cells, like a human. Cells carry out all the chemical reactions needed for life.",
  "Most cells are too small to see with the eye alone. So studying cells needed the microscope. In 1665, Robert Hooke looked at thin slices of cork. He called the tiny boxes he saw cells. Biologists still use that word today.",
  "Light microscopes send light through a sample and bend it with lenses. They make things up to about 1,000 times bigger. Electron microscopes use a beam of electrons instead of light. They make things up to 1,000,000 times bigger. So they show parts inside the cell that light cannot.",
  "The cell theory came from Matthias Schleiden, Theodor Schwann and Rudolf Virchow in the nineteenth century. It has three ideas. All living things are made of one or more cells. The cell is the basic unit of life. New cells only come from old cells dividing.",
  "Prokaryotes include bacteria and archaea. They are living things with only one cell. They have no nucleus (a walled-off centre) and no organelles with membranes. Their DNA sits in a central area called the nucleoid.",
  "All prokaryotic cells have four parts. A plasma membrane separates the inside from the outside. Cytoplasm is where the cell's reactions happen. DNA carries the genetic instructions. Ribosomes make proteins.",
  "Most prokaryotes are 0.1 to 5.0 micrometres across. Being small matters. Things that enter the cell can spread quickly to every part (this is diffusion). Waste made inside can also spread out quickly.",
  "When a cell grows, its volume grows faster than its surface area. For a cube with side length L, the ratio is SA:V = 6/L. So a bigger cell has less membrane for its size. It has less surface to swap materials with its surroundings.",
  "Eukaryotic cells make up animals, plants, fungi and protists. They are usually 10 to 100 micrometres across. They have a nucleus with a membrane around it. They also have many organelles (small cell parts) with membranes. These keep different jobs in separate spaces.",
  "The plasma membrane is the thin skin around the cell. It is mostly a phospholipid bilayer (two layers of fat molecules). Proteins, cholesterol and glycolipids sit in it. It lets only some things through. It controls how ions, food and waste move in and out. This keeps conditions in the cell steady (homeostasis), which the cell needs to stay alive.",
  "The cytoplasm is everything between the plasma membrane and the nuclear envelope. It holds organelles in a jelly-like liquid called cytosol. Cytosol is about 70 to 80 percent water. It also has glucose, salts, fatty acids, amino acids and proteins.",
  "The nucleus is usually the biggest organelle in a eukaryotic cell. It holds the cell's DNA. It directs the making of ribosomes and proteins. A double membrane called the nuclear envelope surrounds it. Nuclear pores in the envelope control what moves in and out.",
  "Ribosomes are the cell parts that make proteins. They are made of ribosomal RNA and protein. They are about 20 to 30 nanometres across. Some float free in the cytosol. Others are attached to the endoplasmic reticulum.",
  "Mitochondria are organelles with two membranes. They are often called the powerhouses of the cell. They carry out cellular respiration. This makes ATP (adenosine triphosphate), the cell's main energy molecule. Mitochondria also have their own DNA and ribosomes.",
  "The endoplasmic reticulum is a network of linked sacs and tubes made of membrane. It changes proteins and makes lipids (fats). The rough endoplasmic reticulum is covered in ribosomes. The smooth endoplasmic reticulum has no ribosomes. It makes carbohydrates, lipids and steroid hormones. It also breaks down some medicines.",
  "The Golgi apparatus is a stack of flat sacs made of membrane. It receives small bubbles (vesicles) from the endoplasmic reticulum. Then it sorts, labels, packs and sends lipids and proteins where they need to go. Some go inside the cell and some go outside.",
  "Lysosomes are found in animal cells. They are organelles with a membrane and digestive enzymes inside. The enzymes work best at an acidic pH of about 4.5. Lysosomes break down old organelles, large molecules and swallowed germs.",
  "Plant cells have the same organelles as other eukaryotic cells, plus more. They have a stiff cell wall made mostly of cellulose. Cellulose is a carbohydrate made of glucose units. The wall supports and protects the cell and gives it its shape.",
  "Chloroplasts are plant organelles that carry out photosynthesis. Photosynthesis uses carbon dioxide, water and light energy. It makes glucose and oxygen. Like mitochondria, chloroplasts have their own DNA and ribosomes. This supports the endosymbiotic theory of where they came from.",
  "The central vacuole can fill up to 90 percent of a grown plant cell. It stores water and dissolved substances. It helps control how much water is in the cell. When the vacuole loses water, the plant wilts.",
]

CELL_SUMMARIES = [
  ["Cells are the smallest units of life and carry out its chemical reactions.", "Robert Hooke named cells in 1665 after looking at cork.", "Light microscopes magnify about 1,000 times; electron microscopes up to 1,000,000 times.", "Cell theory: all living things are made of cells.", "New cells come only from existing cells dividing."],
  ["Prokaryotes (bacteria and archaea) have no nucleus or membrane-bound organelles.", "Their DNA sits in the nucleoid.", "All have a plasma membrane, cytoplasm, DNA and ribosomes.", "Most are 0.1 to 5.0 micrometres across, so materials spread quickly.", "Bigger cells have less surface for their volume: SA:V = 6/L."],
  ["Eukaryotic cells are 10 to 100 micrometres and have a nucleus and organelles.", "The plasma membrane controls what enters and leaves the cell.", "The nucleus holds DNA; ribosomes make proteins.", "Mitochondria make ATP; the ER and Golgi apparatus make, change and ship proteins and lipids.", "Lysosomes digest old parts and germs at a pH of about 4.5."],
  ["Plant cells have a cellulose cell wall for support and shape.", "Chloroplasts carry out photosynthesis to make glucose and oxygen.", "Chloroplasts have their own DNA and ribosomes.", "The central vacuole can fill 90 percent of the cell and stores water.", "When the vacuole loses water, the plant wilts."],
]
CELL_DOC_SUMMARY = ["Cells are the basic units of all living things, first named by Robert Hooke in 1665.", "Prokaryotes like bacteria have no nucleus; their DNA sits in the nucleoid.", "Eukaryotic cells have a nucleus and organelles such as mitochondria, ribosomes and the Golgi apparatus.", "The plasma membrane controls what moves in and out of the cell.", "Plant cells also have a cell wall, chloroplasts and a large central vacuole."]

CELL_GLOSSARY = [
  ("Prokaryotes", "Single-celled living things, like bacteria and archaea, with no nucleus.", 4),
  ("nucleoid", "The central area of a prokaryotic cell where its DNA is found.", 4),
  ("ribosomes", "Small cell parts made of RNA and protein that build proteins.", 12),
  ("plasma membrane", "The thin, selectively permeable layer around a cell that controls what enters and leaves.", 9),
  ("phospholipid bilayer", "Two layers of fat molecules that form the main structure of the plasma membrane.", 9),
  ("homeostatic", "Keeping conditions inside the cell steady.", 9),
  ("cytosol", "The jelly-like liquid in the cytoplasm, about 70 to 80 percent water.", 10),
  ("nuclear envelope", "The double membrane around the nucleus, with pores that control traffic.", 11),
  ("Mitochondria", "Double-membraned organelles that carry out cellular respiration to make ATP.", 13),
  ("adenosine triphosphate", "ATP, the main energy-carrying molecule of the cell.", 13),
  ("endoplasmic reticulum", "A network of membrane sacs and tubes that changes proteins and makes lipids.", 14),
  ("Golgi apparatus", "Stacked membrane sacs that sort, tag, pack and send out lipids and proteins.", 15),
  ("Lysosomes", "Organelles in animal cells with digestive enzymes that break down old parts and germs.", 16),
  ("cellulose", "A carbohydrate made of glucose units that forms the plant cell wall.", 17),
  ("photosynthesis", "Reactions that use carbon dioxide, water and light to make glucose and oxygen.", 18),
]

OS_SIMPLE = [
  "An operating system (OS) is system software. It manages a computer's hardware and software. It gives programs common services. It sits between the apps you run and the hardware they run on.",
  "Time-sharing operating systems plan tasks so the system is used well. Some also track how much processor time, storage and other resources each user takes. This design began in the 1960s. Computers were expensive then and many users shared them.",
  "The kernel is the core of an operating system. It is the first program loaded after the bootloader. It stays in memory the whole time. All programs reach the processor, memory and devices through it.",
  "In a monolithic kernel, like the one in Linux, the main services run together in one protected space. These include the scheduler, memory manager, file systems and device drivers. A microkernel moves most services into separate user-space programs. These programs talk by sending messages.",
  "Apps ask the kernel for services using system calls. A system call switches the processor from user mode to kernel mode. Then special (privileged) instructions can run safely. Afterwards, control goes back to the app.",
  "A process is a program that is running. It includes the code, the program counter and registers, a stack, a heap and its resources. Each process is described by a record called the process control block.",
  "Multitasking works by context switching. The OS saves the state of the running process. Then it loads the saved state of another. This makes many processes seem to run at once on one processor core.",
  "Processes sometimes share data. A race condition happens when the result depends on the order their steps run in. To stop this, operating systems offer tools for taking turns. These include the semaphore, introduced by Edsger Dijkstra in 1965, and the mutex.",
  "A deadlock is when each process in a group waits for something another one holds. Nobody can move. It happens only when four conditions are all true: mutual exclusion, hold and wait, no preemption, and circular wait.",
  "Virtual memory gives each process the feeling of one large, unbroken memory space. Page tables map virtual addresses to real physical addresses. This lets the system use disk storage as extra main memory.",
  "Sometimes a process needs a page that is not in physical memory. The hardware then raises a page fault. The OS loads the page from disk. It may remove another page, for example the least recently used one.",
  "A file system stores data as named files inside folders (directories). It records details such as size, owner and permissions. It uses structures like inodes or allocation tables to find each file's blocks.",
]
OS_SUMMARIES = [
  ["An operating system manages hardware and software for programs.", "It sits between apps and the hardware.", "Time-sharing systems began in the 1960s when computers were shared."],
  ["The kernel is the core of the OS and stays in memory.", "Linux uses a monolithic kernel with services in one space.", "Microkernels move services into separate programs that pass messages.", "Apps use system calls to switch from user mode to kernel mode."],
  ["A process is a running program, described by a process control block.", "Context switching lets many processes share one core.", "Race conditions happen when shared data is used in the wrong order.", "Semaphores (Dijkstra, 1965) and mutexes prevent this.", "Deadlock needs four conditions at once, including circular wait."],
  ["Virtual memory gives each process a large address space.", "Page tables map virtual addresses to physical ones.", "A page fault loads a missing page from disk, maybe replacing the least recently used page."],
  ["A file system stores data as named files in directories.", "It records metadata like size and permissions.", "Inodes or allocation tables locate each file's blocks."],
]
OS_DOC_SUMMARY = ["An operating system manages hardware and software and serves programs.", "The kernel is its core, reached through system calls.", "Processes share the CPU through context switching and need tools like semaphores to avoid race conditions.", "Deadlock needs four conditions at the same time.", "Virtual memory and file systems manage memory and storage."]
OS_GLOSSARY = [
  ("operating system", "System software that manages hardware and software and provides services to programs.", 0),
  ("kernel", "The core part of the operating system that controls the processor, memory and devices.", 2),
  ("bootloader", "The program that runs first when a computer starts and loads the kernel.", 2),
  ("microkernel", "A small kernel that moves most services into separate user-space programs.", 3),
  ("system calls", "Requests an app makes to the kernel for a service.", 4),
  ("process control block", "The record the OS keeps about each process.", 5),
  ("context switching", "Saving one process's state and loading another's so they can share the CPU.", 6),
  ("race condition", "An error where the result depends on the order in which processes run.", 7),
  ("semaphore", "A tool, introduced by Edsger Dijkstra in 1965, that helps processes take turns with shared data.", 7),
  ("deadlock", "When processes wait on each other forever and none can continue.", 8),
  ("Virtual memory", "A technique that maps virtual addresses to physical memory and can use disk as extra memory.", 9),
  ("page fault", "The signal raised when a needed page is not in physical memory.", 10),
  ("inodes", "Structures that store a file's details and where its blocks are.", 11),
]

CPU_SIMPLE = [
  "These are lecture notes for Operating Systems, Unit 3. They explain how the operating system picks the next process to run on the processor.",
  "In a multiprogramming system, many processes are in memory at once. Sometimes the running process must wait, for example for input or output. Then the CPU scheduler picks another process from the ready queue. This way, the processor is never idle.",
  "Each process switches between a CPU burst and an I/O burst. In a CPU burst it computes. In an I/O burst it waits. Most processes have many short CPU bursts and a few long ones.",
  "CPU utilisation means keeping the processor busy, ideally 40 to 90 percent of the time.",
  "Throughput is how many processes finish in a unit of time.",
  "Turnaround time is the time from when a process is submitted until it finishes.",
  "Waiting time is the total time a process spends waiting in the ready queue.",
  "Response time is the time from submission until the first response appears.",
  "FCFS is the simplest scheduling method. The process that asks first gets the CPU first. The ready queue works like a line: first in, first out. FCFS is non-preemptive. A process keeps the CPU until its burst ends.",
  "Average waiting time under FCFS is often long. Take three processes with bursts of 24, 3 and 3 milliseconds, in that order. The average wait is 17 milliseconds. If the two short ones come first, it drops to 3 milliseconds. Short processes stuck behind a long one is called the convoy effect.",
  "SJF looks at how long each process's next CPU burst will be. It gives the CPU to the shortest one. SJF is proven optimal. It gives the lowest average waiting time for a set of processes.",
  "The hard part is knowing how long the next burst will be. Schedulers guess using an exponential average of past bursts. Next estimate = alpha times the last burst plus (1 - alpha) times the previous estimate. Alpha is usually 0.5.",
  "The preemptive version is called shortest-remaining-time-first. It stops the running process if a new one arrives with a shorter remaining burst.",
  "Round Robin is made for time-sharing systems. Each process gets a small slice of CPU time called a time quantum. The quantum is usually 10 to 100 milliseconds. Then the process is stopped and goes to the back of the ready queue.",
  "Round Robin's performance depends a lot on the quantum size. A very large quantum makes it act like FCFS. A very small quantum wastes time on context switches.",
  "In priority scheduling, each process has a priority number. The CPU goes to the highest priority process. A big problem is starvation. Low-priority processes may wait forever.",
  "The usual fix is aging. The system slowly raises the priority of processes that have waited a long time. So every process gets to run in the end.",
  "Preemption",
  "Context switch",
  "Dispatcher latency",
  "Convoy effect",
  "Starvation and aging",
]
CPU_SUMMARIES = [
  ["These notes cover how the OS chooses the next process to run."],
  ["Many processes wait in memory at once.", "When one waits for I/O, the scheduler runs another from the ready queue.", "Processes alternate between CPU bursts and I/O bursts."],
  ["Keep the CPU busy, ideally 40 to 90 percent.", "Finish many processes per unit of time (throughput).", "Keep turnaround, waiting and response times low."],
  ["FCFS runs processes in the order they arrive.", "It is non-preemptive.", "Waiting time can be long: 17 ms versus 3 ms in the example.", "Short jobs stuck behind long ones is the convoy effect."],
  ["SJF runs the shortest next burst first and gives the lowest average waiting time.", "Burst length is predicted with an exponential average, alpha usually 0.5.", "The preemptive version is shortest-remaining-time-first."],
  ["Round Robin gives each process a time quantum of 10 to 100 ms.", "A large quantum acts like FCFS.", "A tiny quantum wastes time on context switches."],
  ["Priority scheduling runs the highest-priority process first.", "Low-priority processes can starve.", "Aging slowly raises their priority so all processes run."],
  ["Revise preemption, context switch, dispatcher latency, convoy effect, starvation and aging."],
]
CPU_DOC_SUMMARY = ["The CPU scheduler picks the next process when the running one waits.", "Good scheduling keeps the CPU busy and keeps waiting and response times low.", "FCFS is simple but suffers from the convoy effect.", "SJF gives the lowest average waiting time but needs burst predictions.", "Round Robin uses time quanta; priority scheduling needs aging to prevent starvation."]
CPU_GLOSSARY = [
  ("multiprogramming", "Keeping several processes in memory at once so the CPU always has work.", 1),
  ("ready queue", "The list of processes waiting for their turn on the CPU.", 1),
  ("CPU burst", "A period when a process is computing on the processor.", 2),
  ("Throughput", "The number of processes completed per unit of time.", 4),
  ("Turnaround time", "The time from submitting a process until it finishes.", 5),
  ("non-preemptive", "Once a process has the CPU, it keeps it until its burst ends.", 8),
  ("convoy effect", "Short processes waiting behind one long process.", 9),
  ("exponential average", "A way to predict the next burst from past bursts, weighted by alpha.", 11),
  ("time quantum", "The small slice of CPU time each process gets in Round Robin, usually 10 to 100 ms.", 13),
  ("context switches", "Saving one process's state and loading another's.", 14),
  ("starvation", "When a low-priority process waits forever for the CPU.", 15),
  ("aging", "Slowly raising the priority of processes that have waited a long time.", 16),
]
