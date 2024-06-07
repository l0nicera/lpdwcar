<?php

namespace App\Core;

use Exception;

class Response
{
    protected array $headers = [];
    
    public function __construct(public ?int $status, public mixed $body = null) {}

    public function withStatus(int $status): self
    {
        // Par exemple une gate de status
        if (!in_array($status, [200, 201, 404, 500])) {
            throw new Exception("None supported Status");
        }
        $this->status = $status;
    }

    public function withBody(mixed $body): self
    {
        //Tu peux aussi filter ici le body suivant son type
        $this->body = $body;
    }

    public function withHeader(string $key, string|int $value): self
    {
        $this->headers[$key] = $value;
    }

    /**
     * @param array<string,mixed> $headers
     */
    public function withHeaders(array $headers): self
    {
        foreach($headers as $key=>$value) {
            $this->withHeader($key, $value);
        }
    }

    public static function notFound(): self
    {
        return (new self(null,null))
            ->withStatus(404)
            ->withBody(null);
    }
    /**
     * @param array<mixed,mixed> $data
     */
    public static function json(int $status, array $data): self
    {
        return (new self())
            ->withStatus($status)
            ->withBody($data)
            ->withHeader('Content-Type','application/json');
    }

    /**
    * Render the response to the output
    */
    public function render(): void
    {
        foreach($this->headers as $name => $value) {
            header($name . ':' . $value);
        }

        http_response_code($this->status);

        $payload = null;

        if (in_array('application/json', $this->headers)) {
            $payload = json_encode($this->body);
        }
        // Tu peux ajouter tes autres types de reponse ici...

        if ($payload === null || $payload === false) {
            throw new Exception('Payload is null');
        }

        echo $payload;
        
    }
}
