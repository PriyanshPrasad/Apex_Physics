import type { ComponentType } from "react";
import {
  VectorsSim, KinematicsSim, ProjectileSim, FBDSim, CollisionSim,
  EnergySim, RotationSim, TorqueSim, SHMSim, CircularSim, FluidsSim, RollingSim,
} from "./mechanics";
import {
  GasSim, ChargesSim, MagnetismSim, RCSim, CircuitBuilderSim,
  OpticsSim, WavesSim, DecaySim, PhotoelectricSim, OrbitalSim, CalculusSim,
} from "./fields";

export const SIMS: Record<string, ComponentType> = {
  vectors: VectorsSim,
  kinematics: KinematicsSim,
  projectile: ProjectileSim,
  fbd: FBDSim,
  collision: CollisionSim,
  energy: EnergySim,
  rotation: RotationSim,
  torque: TorqueSim,
  shm: SHMSim,
  circular: CircularSim,
  fluids: FluidsSim,
  rolling: RollingSim,
  gas: GasSim,
  charges: ChargesSim,
  magnetism: MagnetismSim,
  rc: RCSim,
  circuits: CircuitBuilderSim,
  optics: OpticsSim,
  waves: WavesSim,
  decay: DecaySim,
  photoelectric: PhotoelectricSim,
  orbital: OrbitalSim,
  calculus: CalculusSim,
};
