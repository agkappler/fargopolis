import { CharacterForm } from "@/components/dnd/CharacterForm";
import { CharacterInfo } from "@/components/dnd/CharacterInfo";
import { ActionMenu, MenuOption } from "@/components/ui/ActionMenu";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ImageBox } from "@/components/ui/ImageBox";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import { Casino, Edit } from "@mui/icons-material";
import { capitalize, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";

export function CharacterDetailPage() {
  const { id } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { data: character, isLoading, error, mutate } = useSWR<Character>(
    id ? `/character/${id}` : null,
    () => RequestManager.getGateway<Character>(`/character/${id}`),
  );

  const handleEdit = () => {
    setIsOpen(true);
  };

  const handleActions = () => {
    navigate(`/dnd/${id}/actions`);
  };

  const menuOptions: MenuOption[] = [
    {
      label: "Edit Character",
      icon: <Edit />,
      onClick: handleEdit,
    },
    {
      label: "Actions",
      icon: <Casino />,
      onClick: handleActions,
    },
  ];

  if (!id) return <ErrorMessage errorMessage="Missing character id." />;
  if (error) return <ErrorMessage errorMessage={error.message} />;
  return (
    <>
      <LoadingWrapper isLoading={isLoading}>
        <PageHeader
          title={character?.name}
          leftContainer={<LinkButton label="All Characters" url="/dnd" isForward={false} />}
          rightContainer={<ActionMenu options={menuOptions} size="medium" ariaLabel="Character options" />}
        />
        {character && (
          <>
            {character.avatarId && <ImageBox fileId={character.avatarId} altText="Character avatar" />}
            <Typography variant="h6" textAlign="center" fontWeight="light" color="textSecondary">
              {`${capitalize(character.race)}, Level ${character.level} ${capitalize(character.className)}`}
            </Typography>
            <CharacterInfo character={character} />
          </>
        )}
      </LoadingWrapper>
      <CharacterForm isOpen={isOpen} onClose={() => setIsOpen(false)} updateCharacters={mutate} character={character} />
    </>
  );
}
