import { LotActivity } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProgressTrackerProps {
  activities: LotActivity[];
}

export default function ProgressTracker({ activities }: ProgressTrackerProps) {
  // Sort activities by date
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(a.datePerformed).getTime() - new Date(b.datePerformed).getTime()
  );
  
  // Define all possible stages in order
  const stages = [
    { type: "harvest", label: "Récolté" },
    { type: "package", label: "Emballé" },
    { type: "cool", label: "Refroidi" },
    { type: "ship", label: "Expédié" },
    { type: "deliver", label: "Livré" }
  ];
  
  // Find the latest activity for each stage
  const latestByStage = stages.map(stage => {
    const stageActivities = sortedActivities.filter(act => act.activityType === stage.type);
    return stageActivities.length > 0 ? stageActivities[stageActivities.length - 1] : null;
  });
  
  // Determine the current stage index
  const currentStageIndex = latestByStage.reduce((index, activity, currentIndex) => 
    activity ? currentIndex : index, -1
  );
  
  return (
    <div className="mb-6">
      <h3 className="font-medium mb-4">Progression du Lot</h3>
      <ul className="progress-bar flex justify-between items-center">
        {stages.map((stage, index) => {
          const activity = latestByStage[index];
          const isActive = index <= currentStageIndex;
          
          return (
            <li 
              key={stage.type} 
              className={`flex flex-col items-center text-center flex-1 ${isActive ? 'active' : ''}`}
            >
              <div className="text-xs">
                {activity 
                  ? format(new Date(activity.datePerformed), "dd/MM HH:mm", { locale: fr })
                  : "––/––"}
              </div>
              <div className="text-sm mt-1">{stage.label}</div>
            </li>
          );
        })}
      </ul>
      <style jsx>{`
        .progress-bar {
          counter-reset: step;
          position: relative;
        }
        .progress-bar li {
          position: relative;
          counter-increment: step;
        }
        .progress-bar li:before {
          content: counter(step);
          width: 30px;
          height: 30px;
          display: block;
          line-height: 30px;
          text-align: center;
          margin: 0 auto 10px auto;
          border-radius: 50%;
          background-color: #E0E0E0;
          color: #757575;
          z-index: 1;
        }
        .progress-bar li.active:before {
          background-color: #4CAF50;
          color: white;
        }
        .progress-bar li:after {
          content: '';
          position: absolute;
          width: 100%;
          height: 2px;
          background-color: #E0E0E0;
          top: 15px;
          left: -50%;
          z-index: 0;
        }
        .progress-bar li:first-child:after {
          content: none;
        }
        .progress-bar li.active:after {
          background-color: #4CAF50;
        }
      `}</style>
    </div>
  );
}
