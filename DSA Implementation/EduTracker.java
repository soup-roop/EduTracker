import java.util.*;

/*
DSA CO1–CO6 Mapping: Prompt-based EduTracker console program implementing searching, sorting, stack, queue, linked list, priority queue, and HashMap-based analytics
*/

public class EduTracker {

    // DSA CO4: HashMap-compatible module statistics structure for efficient keyed access and updates
    static class ModuleStats {
        String name;
        int opens;
        int clicks;
        int timeSpent;
        int scrollDepth;
        boolean bookmarked;
        boolean completed;

        ModuleStats(String name) {
            this.name = name;
            this.opens = 0;
            this.clicks = 0;
            this.timeSpent = 0;
            this.scrollDepth = 0;
            this.bookmarked = false;
            this.completed = false;
        }

        // DSA CO1: Score computation supports ranking and comparison of module activity
        int getScore() {
            return opens + clicks + (bookmarked ? 3 : 0) + (completed ? 4 : 0);
        }
    }

    // DSA CO3: Event objects are processed through queue-based workflow handling
    static class Event {
        String type;
        String topic;
        String extra;

        Event(String type, String topic, String extra) {
            this.type = type;
            this.topic = topic;
            this.extra = extra;
        }
    }

    // DSA CO3: Action objects are stored in stack-based undo management
    static class Action {
        String type;
        String topic;
        boolean previousBool;
        Goal goalPayload;
        List<Goal> goalsSnapshot;

        Action(String type, String topic, boolean previousBool) {
            this.type = type;
            this.topic = topic;
            this.previousBool = previousBool;
        }

        Action(String type, Goal goalPayload) {
            this.type = type;
            this.goalPayload = goalPayload;
        }

        Action(String type, List<Goal> goalsSnapshot) {
            this.type = type;
            this.goalsSnapshot = goalsSnapshot;
        }

        Action(String type) {
            this.type = type;
        }
    }

    // DSA CO3: Goal objects are used inside a priority queue for prioritized study tasks
    static class Goal {
        String text;
        int priority; // 1 high, 2 medium, 3 low

        Goal(String text, int priority) {
            this.text = text;
            this.priority = priority;
        }
    }

    // DSA CO1: Module collection supports searching, traversal, and ranking operations
    static final String[] MODULE_NAMES = {
        "HTML Basics",
        "CSS Styling",
        "JavaScript",
        "DOM Interactivity",
        "Algorithms",
        "Data Structures"
    };

    // DSA CO4: HashMap used for efficient module lookup and statistics updates
    static HashMap<String, ModuleStats> modules = new HashMap<>();

    // DSA CO3: Queue used for buffering user interaction events
    static Queue<Event> eventQueue = new LinkedList<>();

    // DSA CO3: Stack used to implement undo functionality
    static Stack<Action> undoStack = new Stack<>();

    // DSA CO2: Linked list used to maintain recent activity timeline
    static LinkedList<String> recentActivity = new LinkedList<>();

    // DSA CO3: Priority queue used for ordered study goal management
    static PriorityQueue<Goal> goals = new PriorityQueue<>(
        (a, b) -> Integer.compare(a.priority, b.priority)
    );

    static int totalClicks = 0;
    static final int MAX_ACTIVITY = 10;

    // DSA CO2: Linked-list insertion at the front maintains most recent activity first
    static void addActivity(String message) {
        recentActivity.addFirst(message);
        if (recentActivity.size() > MAX_ACTIVITY) {
            recentActivity.removeLast();
        }
    }

    // DSA CO3: Queue insertion stores events before processing
    static void queueEvent(String type, String topic, String extra) {
        eventQueue.offer(new Event(type, topic, extra));
    }

    // DSA CO5: Practical queue-based event processing workflow for analytics management
    static void processQueue() {
        while (!eventQueue.isEmpty()) {
            Event e = eventQueue.poll();

            if (modules.containsKey(e.topic)) {
                ModuleStats m = modules.get(e.topic);

                switch (e.type) {
                    case "open":
                        m.opens++;
                        addActivity("Opened " + e.topic);
                        break;
                    case "click":
                        totalClicks++;
                        m.clicks++;
                        break;
                    case "bookmark":
                        addActivity("Bookmarked " + e.topic);
                        break;
                    case "complete":
                        addActivity("Completed " + e.topic);
                        break;
                    case "time":
                        try {
                            int t = Integer.parseInt(e.extra);
                            m.timeSpent += t;
                        } catch (Exception ignored) {}
                        break;
                    case "scroll":
                        try {
                            int s = Integer.parseInt(e.extra);
                            if (s > m.scrollDepth) {
                                m.scrollDepth = s;
                            }
                        } catch (Exception ignored) {}
                        break;
                    case "note":
                        addActivity("Saved note in " + e.topic + ": " + e.extra);
                        break;
                }
            } else {
                switch (e.type) {
                    case "goal-add":
                        addActivity("Added goal: " + e.extra);
                        break;
                    case "goal-pop":
                        addActivity("Popped goal: " + e.extra);
                        break;
                    case "goal-clear":
                        addActivity("Cleared all goals");
                        break;
                }
            }
        }
    }

    // DSA CO4: Traversal of keyed module records supports aggregate bookmark computation
    static int getBookmarkCount() {
        int count = 0;
        for (ModuleStats m : modules.values()) {
            if (m.bookmarked) count++;
        }
        return count;
    }

    // DSA CO4: Traversal of keyed module records supports aggregate completion computation
    static int getCompletedCount() {
        int count = 0;
        for (ModuleStats m : modules.values()) {
            if (m.completed) count++;
        }
        return count;
    }

    // DSA CO1: Aggregate computation enables comparison of module engagement levels
    static int getAverageScroll() {
        int sum = 0;
        for (ModuleStats m : modules.values()) {
            sum += m.scrollDepth;
        }
        return sum / modules.size();
    }

    // DSA CO5: Practical aggregation of total time across all modules
    static int getTotalTime() {
        int sum = 0;
        for (ModuleStats m : modules.values()) {
            sum += m.timeSpent;
        }
        return sum;
    }

    // DSA CO1: Sorting is used to rank top topics based on engagement score
    static List<ModuleStats> getTopTopics() {
        List<ModuleStats> list = new ArrayList<>(modules.values());
        list.sort((a, b) -> {
            if (b.getScore() != a.getScore()) {
                return Integer.compare(b.getScore(), a.getScore());
            }
            return Integer.compare(b.timeSpent, a.timeSpent);
        });
        return list;
    }

    // DSA CO6: Complete traversal and display of module state within the application
    static void showModules() {
        System.out.println("\n--- MODULES ---");
        int i = 1;
        for (String name : MODULE_NAMES) {
            ModuleStats m = modules.get(name);
            System.out.println(i + ". " + name
                + " | Opens: " + m.opens
                + " | Bookmarked: " + (m.bookmarked ? "Yes" : "No")
                + " | Completed: " + (m.completed ? "Yes" : "No"));
            i++;
        }
    }

    // DSA CO5: Practical analytics reporting using multiple data structure outputs
    static void showAnalytics() {
        processQueue();

        System.out.println("\n=== LIVE ANALYTICS ===");
        System.out.println("Total Clicks: " + totalClicks);
        System.out.println("Average Scroll Depth: " + getAverageScroll() + "%");
        System.out.println("Total Time Spent: " + getTotalTime() + "s");
        System.out.println("Queue Size: " + eventQueue.size());
        System.out.println("Bookmarks: " + getBookmarkCount());
        System.out.println("Completed Modules: " + getCompletedCount());
        System.out.println("Total Modules: " + modules.size());

        List<ModuleStats> top = getTopTopics();
        System.out.println("\nTop Topics:");
        boolean any = false;
        for (int i = 0; i < Math.min(5, top.size()); i++) {
            ModuleStats m = top.get(i);
            if (m.getScore() > 0 || m.timeSpent > 0) {
                any = true;
                System.out.println((i + 1) + ". " + m.name
                    + " | Score: " + m.getScore()
                    + " | Time: " + m.timeSpent + "s");
            }
        }
        if (!any) {
            System.out.println("No topic activity yet.");
        }

        System.out.println("\nRecent Activity:");
        if (recentActivity.isEmpty()) {
            System.out.println("No recent activity yet.");
        } else {
            for (String s : recentActivity) {
                System.out.println("- " + s);
            }
        }
    }

    // DSA CO6: Module interaction workflow integrates search, queue, stack, and updates in one application flow
    static void openModule(Scanner sc) {
        showModules();
        System.out.print("\nEnter module number to open: ");
        int choice = sc.nextInt();
        sc.nextLine();

        if (choice < 1 || choice > MODULE_NAMES.length) {
            System.out.println("Invalid module choice.");
            return;
        }

        String moduleName = MODULE_NAMES[choice - 1];
        queueEvent("open", moduleName, "");
        queueEvent("click", moduleName, "");
        processQueue();

        while (true) {
            ModuleStats m = modules.get(moduleName);
            System.out.println("\n=== " + moduleName + " ===");
            System.out.println("1. Toggle Bookmark");
            System.out.println("2. Toggle Complete");
            System.out.println("3. Add Time Spent");
            System.out.println("4. Update Scroll Depth");
            System.out.println("5. Save Note");
            System.out.println("6. Simulate Click");
            System.out.println("7. Show Module Stats");
            System.out.println("8. Back to Main Menu");
            System.out.print("Choose: ");

            int op = sc.nextInt();
            sc.nextLine();

            switch (op) {
                case 1: {
                    boolean prev = m.bookmarked;
                    m.bookmarked = !m.bookmarked;
                    undoStack.push(new Action("bookmark-toggle", moduleName, prev));
                    queueEvent("bookmark", moduleName, "");
                    processQueue();
                    System.out.println("Bookmark status changed.");
                    break;
                }
                case 2: {
                    boolean prev = m.completed;
                    m.completed = !m.completed;
                    undoStack.push(new Action("complete-toggle", moduleName, prev));
                    queueEvent("complete", moduleName, "");
                    processQueue();
                    System.out.println("Complete status changed.");
                    break;
                }
                case 3: {
                    System.out.print("Enter seconds spent: ");
                    int seconds = sc.nextInt();
                    sc.nextLine();
                    queueEvent("time", moduleName, String.valueOf(seconds));
                    processQueue();
                    System.out.println("Time updated.");
                    break;
                }
                case 4: {
                    System.out.print("Enter scroll depth (0-100): ");
                    int scroll = sc.nextInt();
                    sc.nextLine();
                    if (scroll < 0) scroll = 0;
                    if (scroll > 100) scroll = 100;
                    queueEvent("scroll", moduleName, String.valueOf(scroll));
                    processQueue();
                    System.out.println("Scroll depth updated.");
                    break;
                }
                case 5: {
                    System.out.print("Enter note: ");
                    String note = sc.nextLine();
                    queueEvent("note", moduleName, note);
                    processQueue();
                    System.out.println("Note saved.");
                    break;
                }
                case 6: {
                    queueEvent("click", moduleName, "");
                    processQueue();
                    System.out.println("Click recorded.");
                    break;
                }
                case 7: {
                    System.out.println("\nModule Stats:");
                    System.out.println("Name: " + m.name);
                    System.out.println("Opens: " + m.opens);
                    System.out.println("Clicks: " + m.clicks);
                    System.out.println("Time Spent: " + m.timeSpent + "s");
                    System.out.println("Scroll Depth: " + m.scrollDepth + "%");
                    System.out.println("Bookmarked: " + (m.bookmarked ? "Yes" : "No"));
                    System.out.println("Completed: " + (m.completed ? "Yes" : "No"));
                    break;
                }
                case 8:
                    return;
                default:
                    System.out.println("Invalid option.");
            }
        }
    }

    // DSA CO3: Goal insertion uses priority queue ordering for prioritized study management
    static void addGoal(Scanner sc) {
        System.out.print("Enter goal text: ");
        String text = sc.nextLine();

        System.out.print("Enter priority (1=High, 2=Medium, 3=Low): ");
        int priority = sc.nextInt();
        sc.nextLine();

        if (priority < 1 || priority > 3) {
            System.out.println("Invalid priority.");
            return;
        }

        Goal g = new Goal(text, priority);
        goals.offer(g);
        undoStack.push(new Action("goal-add"));
        queueEvent("goal-add", "Goals", text);
        processQueue();
        System.out.println("Goal added.");
    }

    // DSA CO3: Priority queue removal returns the highest-priority study goal first
    static void popTopGoal() {
        if (goals.isEmpty()) {
            System.out.println("No goals to pop.");
            return;
        }

        Goal removed = goals.poll();
        undoStack.push(new Action("goal-pop", removed));
        queueEvent("goal-pop", "Goals", removed.text);
        processQueue();
        System.out.println("Popped top goal: " + removed.text);
    }

    // DSA CO3: Priority queue state can be cleared and restored through stack-supported undo
    static void clearGoals() {
        if (goals.isEmpty()) {
            System.out.println("Goals already empty.");
            return;
        }

        List<Goal> snapshot = new ArrayList<>(goals);
        goals.clear();
        undoStack.push(new Action("goal-clear", snapshot));
        queueEvent("goal-clear", "Goals", "");
        processQueue();
        System.out.println("All goals cleared.");
    }

    // DSA CO3: Priority queue traversal is demonstrated by ordered display of goals
    static void showGoals() {
        System.out.println("\n--- STUDY GOALS ---");
        if (goals.isEmpty()) {
            System.out.println("No goals added yet.");
            return;
        }

        PriorityQueue<Goal> temp = new PriorityQueue<>((a, b) -> Integer.compare(a.priority, b.priority));
        temp.addAll(goals);

        int i = 1;
        while (!temp.isEmpty()) {
            Goal g = temp.poll();
            String label = (g.priority == 1) ? "High" : (g.priority == 2) ? "Medium" : "Low";
            System.out.println(i + ". " + g.text + " (" + label + ")");
            i++;
        }
    }

    // DSA CO1: Linear search is used to find matching modules from user input
    static void searchModules(Scanner sc) {
        System.out.print("Enter search text: ");
        String query = sc.nextLine().toLowerCase();

        System.out.println("\nSearch Results:");
        boolean found = false;
        for (String module : MODULE_NAMES) {
            if (module.toLowerCase().contains(query)) {
                System.out.println("- " + module);
                found = true;
            }
        }

        if (!found) {
            System.out.println("No matching module found.");
        }
    }

    // DSA CO3: Stack pop operation restores previous application state through undo
    static void undoLastAction() {
        if (undoStack.isEmpty()) {
            System.out.println("Nothing to undo.");
            return;
        }

        Action action = undoStack.pop();

        switch (action.type) {
            case "bookmark-toggle": {
                ModuleStats m = modules.get(action.topic);
                m.bookmarked = action.previousBool;
                addActivity("Undo bookmark change for " + action.topic);
                break;
            }
            case "complete-toggle": {
                ModuleStats m = modules.get(action.topic);
                m.completed = action.previousBool;
                addActivity("Undo completion change for " + action.topic);
                break;
            }
            case "goal-add": {
                if (!goals.isEmpty()) {
                    goals.poll();
                    addActivity("Undo goal add");
                }
                break;
            }
            case "goal-pop": {
                if (action.goalPayload != null) {
                    goals.offer(action.goalPayload);
                    addActivity("Undo goal pop");
                }
                break;
            }
            case "goal-clear": {
                if (action.goalsSnapshot != null) {
                    goals.clear();
                    goals.addAll(action.goalsSnapshot);
                    addActivity("Undo clear goals");
                }
                break;
            }
            default:
                System.out.println("Nothing to undo for this action.");
                return;
        }

        System.out.println("Last action undone.");
    }

    // DSA CO6: Complete application reset demonstrates end-to-end program control
    static void resetAll() {
        totalClicks = 0;
        eventQueue.clear();
        undoStack.clear();
        recentActivity.clear();
        goals.clear();

        modules.clear();
        for (String name : MODULE_NAMES) {
            modules.put(name, new ModuleStats(name));
        }

        System.out.println("All analytics and progress reset.");
    }

    // DSA CO6: Main driver function integrates all data structures into a working application
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        for (String name : MODULE_NAMES) {
            modules.put(name, new ModuleStats(name));
        }

        while (true) {
            processQueue();

            System.out.println("\n==============================");
            System.out.println("        EDUTRACK CONSOLE      ");
            System.out.println("==============================");
            System.out.println("1. Show Modules");
            System.out.println("2. Open Module");
            System.out.println("3. Add Study Goal");
            System.out.println("4. Pop Top Goal");
            System.out.println("5. Clear Goals");
            System.out.println("6. Show Goals");
            System.out.println("7. Search Modules");
            System.out.println("8. Show Analytics");
            System.out.println("9. Undo Last Action");
            System.out.println("10. Reset All Data");
            System.out.println("11. Exit");
            System.out.print("Enter choice: ");

            int choice;
            if (!sc.hasNextInt()) {
                System.out.println("Please enter a valid number.");
                sc.nextLine();
                continue;
            }
            choice = sc.nextInt();
            sc.nextLine();

            switch (choice) {
                case 1:
                    showModules();
                    break;
                case 2:
                    openModule(sc);
                    break;
                case 3:
                    addGoal(sc);
                    break;
                case 4:
                    popTopGoal();
                    break;
                case 5:
                    clearGoals();
                    break;
                case 6:
                    showGoals();
                    break;
                case 7:
                    searchModules(sc);
                    break;
                case 8:
                    showAnalytics();
                    break;
                case 9:
                    undoLastAction();
                    break;
                case 10:
                    resetAll();
                    break;
                case 11:
                    System.out.println("Exiting EduTracker. Goodbye!");
                    return;
                default:
                    System.out.println("Invalid choice.");
            }
        }
    }
}