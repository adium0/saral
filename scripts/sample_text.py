# Sample content written by the Saral team for the demo (no third-party text).
CELL = {
  "title": "Cell Structure",
  "header": "Introductory Biology  ·  Chapter 4: Cell Structure",
  "sections": [
    ("4.1 Studying Cells", [
      "A cell is the smallest unit of a living thing, and every organism, whether it consists of a single cell, like a bacterium, or of trillions of cells, like a human being, is constructed from these fundamental units, which carry out all of the chemical reactions that are necessary for life.",
      "Because most cells are far too small to be seen with the unaided eye, the study of cells depended on the development of the microscope; in 1665 Robert Hooke examined thin slices of cork and described the tiny compartments he observed as cells, a term that biologists continue to use today.",
      "Light microscopes, which pass visible light through a specimen and bend it through a system of lenses, can magnify objects up to approximately 1,000 times, whereas electron microscopes, which use a beam of electrons rather than light, achieve magnifications of up to 1,000,000 times and therefore reveal structures inside the cell that cannot otherwise be resolved.",
      "The cell theory, developed during the nineteenth century by Matthias Schleiden, Theodor Schwann and Rudolf Virchow, states that all living organisms are composed of one or more cells, that the cell is the basic unit of life, and that new cells arise only from the division of pre-existing cells.",
    ]),
    ("4.2 Prokaryotic Cells", [
      "Prokaryotes, which include bacteria and archaea, are single-celled organisms that lack a membrane-bound nucleus and other membrane-bound organelles; instead, their genetic material is located in a central region of the cell called the nucleoid.",
      "All prokaryotic cells share four common components: a plasma membrane that separates the interior of the cell from its environment, cytoplasm in which the cellular reactions occur, DNA that carries the genetic instructions, and ribosomes that synthesise proteins.",
      "Most prokaryotes range from 0.1 to 5.0 micrometres in diameter, and their small size is significant because it allows ions and organic molecules that enter the cell to diffuse rapidly to all of its regions, while waste products produced within the cell can likewise diffuse out quickly.",
      "As a cell increases in size, its volume grows faster than its surface area; for a cube with side length L, the ratio is expressed as SA:V = 6/L, which means that a larger cell has relatively less membrane through which to exchange materials with its surroundings.",
    ]),
    ("4.3 Eukaryotic Cells", [
      "Eukaryotic cells, which make up animals, plants, fungi and protists, are typically 10 to 100 micrometres in diameter and are characterised by a membrane-bound nucleus together with numerous membrane-bound organelles that allow different metabolic processes to be compartmentalised within the cell.",
      "The plasma membrane, which is composed predominantly of a phospholipid bilayer interspersed with integral and peripheral proteins, cholesterol and glycolipids, functions as a selectively permeable barrier that regulates the transport of ions, nutrients and metabolic waste products, thereby maintaining the homeostatic conditions that are indispensable for cellular viability.",
      "The cytoplasm comprises the entire region of the cell between the plasma membrane and the nuclear envelope, and it consists of organelles suspended in a gel-like cytosol, which is approximately 70 to 80 percent water and contains dissolved glucose, salts, fatty acids, amino acids and proteins.",
      "The nucleus, typically the most prominent organelle in a eukaryotic cell, houses the cell's DNA and directs the synthesis of ribosomes and proteins; it is surrounded by a double membrane called the nuclear envelope, which is perforated by nuclear pores that regulate the passage of molecules between the nucleus and the cytoplasm.",
      "Ribosomes, which are the cellular structures responsible for protein synthesis, are composed of ribosomal RNA and protein, measure approximately 20 to 30 nanometres in diameter, and are found either free in the cytosol or attached to the cytoplasmic side of the endoplasmic reticulum.",
      "Mitochondria are double-membraned organelles, often described as the powerhouses of the cell, that carry out cellular respiration and thereby produce adenosine triphosphate (ATP), the principal energy-carrying molecule of the cell; notably, mitochondria possess their own DNA and ribosomes.",
      "The endoplasmic reticulum is a series of interconnected membranous sacs and tubules that collectively modify proteins and synthesise lipids; the rough endoplasmic reticulum is studded with ribosomes, whereas the smooth endoplasmic reticulum, which lacks ribosomes, synthesises carbohydrates, lipids and steroid hormones and detoxifies certain medications.",
      "The Golgi apparatus, which consists of a series of flattened membranous sacs, receives vesicles from the endoplasmic reticulum and subsequently sorts, tags, packages and distributes lipids and proteins to their final destinations both inside and outside the cell.",
      "Lysosomes, which are found in animal cells, are membrane-bound organelles containing digestive enzymes that function optimally at an acidic pH of approximately 4.5, and they break down worn-out organelles, macromolecules and engulfed pathogens.",
    ]),
    ("4.4 Features of Plant Cells", [
      "In addition to the organelles common to all eukaryotic cells, plant cells possess a rigid cell wall composed principally of cellulose, a polysaccharide made of glucose units, which provides structural support, protects the cell and gives it its characteristic shape.",
      "Chloroplasts are plant cell organelles that carry out photosynthesis, a series of reactions that uses carbon dioxide, water and light energy to produce glucose and oxygen; like mitochondria, chloroplasts contain their own DNA and ribosomes, which supports the endosymbiotic theory of their origin.",
      "The central vacuole, which can occupy as much as 90 percent of the volume of a mature plant cell, stores water and dissolved substances and plays a key role in regulating the concentration of water in the cell, so that when the vacuole loses water the plant wilts.",
    ]),
  ],
}

OS = {
  "title": "Operating Systems",
  "header": "Encyclopedia of Computing  ·  Operating system",
  "sections": [
    ("Operating system", [
      "An operating system (OS) is system software that manages computer hardware and software resources and provides common services for computer programs, acting as an intermediary between the applications that a user runs and the physical hardware on which those applications execute.",
      "Time-sharing operating systems schedule tasks for efficient use of the system and may also include accounting software for cost allocation of processor time, mass storage, peripherals and other resources, a design that emerged in the 1960s when computers were expensive and shared among many users.",
    ]),
    ("Kernel", [
      "The kernel is the central component of an operating system; it is the first program loaded after the bootloader, it remains resident in memory, and it mediates all access to the processor, memory and input/output devices on behalf of application programs.",
      "In a monolithic kernel, such as the one used by Linux, the core services including the scheduler, memory manager, file systems and device drivers all execute in a single privileged address space, whereas a microkernel moves most of these services into separate user-space processes that communicate by message passing.",
      "Applications request services from the kernel through system calls, which switch the processor from user mode to kernel mode so that privileged instructions can be executed safely, and then return control to the application once the request has been serviced.",
    ]),
    ("Process management and concurrency", [
      "A process is an instance of a program in execution, comprising the program code, its current activity as represented by the program counter and registers, a stack, a heap and the resources allocated to it, and each process is described by a data structure called the process control block.",
      "Multitasking is achieved through context switching, in which the operating system saves the state of the currently running process and restores the saved state of another, giving the appearance that many processes run simultaneously on a single processor core.",
      "When several processes share data, a race condition can occur if the final outcome depends on the order in which their instructions are interleaved; to prevent this, operating systems provide synchronisation primitives such as the semaphore, introduced by Edsger Dijkstra in 1965, and the mutex.",
      "A deadlock is a situation in which each process in a set is waiting for a resource held by another process in the same set, and it can arise only when four conditions hold simultaneously: mutual exclusion, hold and wait, no preemption, and circular wait.",
    ]),
    ("Memory management", [
      "Virtual memory is a memory-management technique that gives each process the illusion of a large, contiguous address space by mapping virtual addresses to physical addresses through page tables, allowing the system to use secondary storage as an extension of main memory.",
      "When a process references a page that is not currently in physical memory, the hardware raises a page fault, and the operating system responds by loading the required page from disk, possibly evicting another page according to a replacement policy such as least recently used.",
    ]),
    ("File systems", [
      "A file system organises data on storage devices into named files and hierarchical directories, records metadata such as size, ownership and permissions, and uses structures such as inodes or allocation tables to locate the blocks that make up each file.",
    ]),
  ],
}

CPU = {
  "title": "CPU Scheduling",
  "sections": [
    ("CPU Scheduling", [
      ("p", "Lecture notes, Operating Systems, Unit 3. These notes summarise how an operating system decides which process runs on the processor next."),
    ]),
    ("Why scheduling matters", [
      ("p", "In a multiprogramming system, several processes are kept in memory at once. When the running process has to wait, for example for input or output, the CPU scheduler selects another process from the ready queue so that the processor is never idle."),
      ("p", "Each process alternates between a CPU burst, when it computes, and an I/O burst, when it waits. Most processes have many short CPU bursts and a few long ones."),
    ]),
    ("Scheduling criteria", [
      ("li", "CPU utilisation: keep the processor as busy as possible, ideally between 40 and 90 percent."),
      ("li", "Throughput: the number of processes completed per unit of time."),
      ("li", "Turnaround time: the interval from the submission of a process to its completion."),
      ("li", "Waiting time: the total time a process spends waiting in the ready queue."),
      ("li", "Response time: the time from submission until the first response is produced."),
    ]),
    ("First-Come, First-Served (FCFS)", [
      ("p", "FCFS is the simplest scheduling algorithm: the process that requests the CPU first is allocated the CPU first, and the ready queue is managed as a first-in, first-out queue. FCFS is non-preemptive, so once a process has the CPU it keeps it until it finishes its burst."),
      ("p", "The average waiting time under FCFS is often long. If processes with bursts of 24, 3 and 3 milliseconds arrive in that order, the average waiting time is 17 milliseconds, but if the two short processes arrive first it falls to 3 milliseconds. This effect, where short processes wait behind a long one, is called the convoy effect."),
    ]),
    ("Shortest-Job-First (SJF)", [
      ("p", "SJF associates each process with the length of its next CPU burst and assigns the CPU to the process with the smallest one. SJF is provably optimal because it gives the minimum average waiting time for a given set of processes."),
      ("p", "The difficulty is knowing the length of the next burst. Schedulers predict it with an exponential average of previous bursts, where the next estimate equals alpha times the last burst plus (1 - alpha) times the previous estimate, with alpha usually set to 0.5."),
      ("p", "The preemptive version, called shortest-remaining-time-first, interrupts the running process when a new process arrives with a shorter remaining burst."),
    ]),
    ("Round Robin (RR)", [
      ("p", "Round Robin is designed for time-sharing systems. Each process receives a small unit of CPU time called a time quantum, usually 10 to 100 milliseconds, after which it is preempted and added to the end of the ready queue."),
      ("p", "Performance depends heavily on the size of the quantum. If the quantum is very large, RR behaves like FCFS; if it is very small, the system spends too much time on context switches."),
    ]),
    ("Priority scheduling and starvation", [
      ("p", "In priority scheduling, each process has a priority number and the CPU goes to the process with the highest priority. A major problem is starvation, where low-priority processes may wait indefinitely."),
      ("p", "The usual solution is aging: the system gradually raises the priority of processes that have waited a long time, so that every process is eventually scheduled."),
    ]),
    ("Key terms to revise", [
      ("li", "Preemption"), ("li", "Context switch"), ("li", "Dispatcher latency"), ("li", "Convoy effect"), ("li", "Starvation and aging"),
    ]),
  ],
}
